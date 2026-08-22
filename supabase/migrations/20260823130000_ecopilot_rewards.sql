-- v006_ecopilot_rewards.sql
-- Real, persisted EcoCredits ledger + reward redemptions (ported from the
-- expanded prototype's rewards engine — see lib/ecopilot/calculations.ts
-- for the credit formula and lib/ecopilot/rewards.ts for the catalog).
--
-- Unlike ecopilot_co2_logs (self-reported, client can insert directly),
-- these two tables only ever change balance — so writes are restricted to
-- service_role only. All earning/redeeming goes through app/api/ecopilot
-- routes, which validate the business logic (credit formula, sufficient
-- balance) before writing. This mirrors the `jobs` table's trusted-server
-- pattern rather than the self-reported `ecopilot_co2_logs` pattern.

create table ecopilot_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null, -- positive = earned, negative = redeemed
  reason text not null,
  co2_log_id uuid references ecopilot_co2_logs (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ecopilot_credit_transactions_user_idx on ecopilot_credit_transactions (user_id, created_at desc);

create table ecopilot_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id text not null,
  credits_cost int not null,
  voucher_code text not null,
  redeemed_at timestamptz not null default now()
);

create index ecopilot_reward_redemptions_user_idx on ecopilot_reward_redemptions (user_id, redeemed_at desc);

alter table ecopilot_credit_transactions enable row level security;
alter table ecopilot_reward_redemptions enable row level security;

create policy "ecopilot_credit_transactions_select_own" on ecopilot_credit_transactions
  for select using (auth.uid() = user_id);

create policy "ecopilot_reward_redemptions_select_own" on ecopilot_reward_redemptions
  for select using (auth.uid() = user_id);

-- Only select is granted to authenticated — no insert/update/delete, so all
-- balance-affecting writes must go through service_role (our API routes).
grant select on ecopilot_credit_transactions to authenticated;
grant select on ecopilot_reward_redemptions to authenticated;

grant all on ecopilot_credit_transactions to service_role;
grant all on ecopilot_reward_redemptions to service_role;

-- Atomic redemption: check balance, insert the redemption, insert the
-- matching negative transaction — all in one statement so concurrent
-- requests can't double-spend the same balance.
create or replace function public.redeem_ecopilot_reward(
  p_user_id uuid,
  p_reward_id text,
  p_credits_cost int,
  p_voucher_code text
)
returns ecopilot_reward_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_redemption ecopilot_reward_redemptions;
begin
  select coalesce(sum(amount), 0) into v_balance
  from ecopilot_credit_transactions
  where user_id = p_user_id;

  if v_balance < p_credits_cost then
    raise exception 'Insufficient balance: have %, need %', v_balance, p_credits_cost;
  end if;

  insert into ecopilot_reward_redemptions (user_id, reward_id, credits_cost, voucher_code)
  values (p_user_id, p_reward_id, p_credits_cost, p_voucher_code)
  returning * into v_redemption;

  insert into ecopilot_credit_transactions (user_id, amount, reason)
  values (p_user_id, -p_credits_cost, 'Redeemed: ' || p_reward_id);

  return v_redemption;
end;
$$;

revoke all on function public.redeem_ecopilot_reward(uuid, text, int, text) from public;
grant execute on function public.redeem_ecopilot_reward(uuid, text, int, text) to service_role;
