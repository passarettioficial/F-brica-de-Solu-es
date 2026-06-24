---
name: Aplicar cupom no checkout (DB coupons → Stripe)
description: Como cupons internos do DB viram desconto no Stripe Checkout e como contar uso com segurança
---

# Cupons são internos (DB), não objetos Stripe

A tabela `coupons` (code, discountType percent|fixed, discountValue, maxUses,
usesCount, expiresAt, active, appliesTo CSV de planIds) é a fonte de verdade.
O Stripe não conhece esses cupons até o checkout.

**Fluxo de aplicação:** validar no DB → mapear para um Stripe Coupon → passar
`discounts: [{ coupon }]` na Checkout Session → contar uso no webhook.

- O mapeamento usa um **id determinístico** (`ff_<CODE>_pct_<n>` / `ff_<CODE>_amt_<n>`)
  com retrieve-or-create, então o mesmo cupom não cria objetos Stripe duplicados.
- `percent` → `percent_off`; `fixed` → `amount_off` em **centavos** + `currency: "brl"`.
- `duration: "once"` → desconto só na primeira fatura. Se algum dia o produto exigir
  desconto recorrente, mudar para `repeating`/`forever` (não há campo de duração no schema).
- `discounts` e `allow_promotion_codes` são mutuamente exclusivos na Checkout Session.

# Contar uso de cupom no webhook com segurança

Incrementar `usesCount` em `checkout.session.completed` exige DUAS proteções:

1. **Idempotência:** o Stripe reentrega eventos. Carregue o user antes de atualizar e
   pule o incremento se `existing.stripeSubscriptionId === subscriptionId` (já processado).
2. **Limite atômico:** incremente com `UPDATE ... SET uses_count = uses_count + 1
   WHERE code = ? AND (max_uses IS NULL OR uses_count < max_uses) RETURNING *`.
   Só escreva o audit `user.coupon.redeemed` se `returning()` devolver linha.

**Why:** sem (1) eventos repetidos contam em dobro; sem (2) checkouts concorrentes
ultrapassam `maxUses`. Validar `maxUses` só na criação da sessão não basta — a verdade
da contagem precisa ser atômica no momento do incremento.

**How to apply:** qualquer novo contador disparado por webhook Stripe deve assumir
entrega ≥1 vez e usar increment condicional + guard de idempotência por subscription/session.

# Endpoint de validação user-facing

`POST /api/billing/validate-coupon` (requer auth, não admin) valida e devolve
discountType/discountValue/description/appliesTo para o front exibir preço com desconto.
O front só manda `couponCode` no checkout quando o cupom se aplica ao plano (`appliesTo`),
mas o checkout revalida no servidor de qualquer forma (defesa em profundidade).
