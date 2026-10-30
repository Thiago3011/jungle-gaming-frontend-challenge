import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, email: string, password = 'Kurio123!') {
  await page.goto('/login')
  await page.locator('input[aria-label="E-mail"]').fill(email)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login$/)
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('kurio-session-v2')))).toBe(true)
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/profile$/)
}

async function addFeaturedNftToCart(page: Page) {
  await page.goto('/nft/ape-009')
  await page.locator('button:visible').filter({ hasText: /COMPRAR|Comprar NFT/i }).first().click()
  await expect(page.getByRole('dialog', { name: 'NFT adicionado ao carrinho!' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByText('Sage Nomad #009')).toBeVisible()
}

test.describe('isolamento de dados por conta', () => {
  test('mantém perfil, carteiras e carrinho independentes entre usuários', async ({ page }) => {
    await login(page, 'thiago@kurio.demo')
    await expect(page.locator('#displayName')).toHaveValue('Thiago Colecionador')

    await page.goto('/wallets')
    await expect(page.locator('#primary-wallet-nickname')).toHaveValue('Minha MetaMask')
    await addFeaturedNftToCart(page)

    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)

    await login(page, 'bia@kurio.demo')
    await expect(page.locator('#displayName')).toHaveValue('Beatriz Colecionadora')

    await page.goto('/wallets')
    await expect(page.locator('#primary-wallet-nickname')).toHaveValue('WalletConnect principal')

    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  })

  test('preserva o carrinho de visitante quando a pessoa entra na conta', async ({ page }) => {
    await addFeaturedNftToCart(page)
    await login(page, 'bia@kurio.demo')
    await page.goto('/cart')
    await expect(page.getByText('Sage Nomad #009')).toBeVisible()
  })

  test('rejeita credenciais inválidas e e-mail duplicado no cadastro', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[aria-label="E-mail"]').fill('nao-existe@kurio.demo')
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível entrar')

    await page.goto('/register')
    await page.getByLabel('Nome de usuário').fill('Outro Thiago')
    await page.locator('input[aria-label="E-mail"]').fill('THIAGO@KURIO.DEMO')
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('Senha123!')
    await page.getByLabel('Confirmar senha').fill('Senha123!')
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível criar a conta')
  })
})

test.describe('contratos REST críticos', () => {
  test('mantém favoritos isolados por conta usando a API', async ({ page }) => {
    await login(page, 'thiago@kurio.demo')
    const first = await page.evaluate(async () => {
      const response = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nftId: 'ape-009' }) })
      return { status: response.status, ids: await response.json() as string[] }
    })
    expect(first.status).toBe(201)
    expect(first.ids).toContain('ape-009')

    await page.getByRole('button', { name: 'Sair' }).click()
    await login(page, 'bia@kurio.demo')
    const second = await page.evaluate(async () => {
      const response = await fetch('/api/favorites')
      return await response.json() as string[]
    })
    expect(second).not.toContain('ape-009')
  })

  test('reutiliza o mesmo pedido para a mesma chave de idempotência', async ({ page }) => {
    await login(page, 'thiago@kurio.demo')
    await addFeaturedNftToCart(page)
    const result = await page.evaluate(async () => {
      const payload = {
        profile: { displayName: 'Thiago', username: 'thiago', profileName: 'Thiago', address: '0xA91F00000000000000000000000000000000E82C', email: 'thiago@kurio.demo', network: 'Ethereum' },
        paymentMethod: 'MetaMask',
        promoCode: '',
      }
      const send = (body: typeof payload) => fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'e2e-stable-attempt-001' },
        body: JSON.stringify(body),
      })
      const firstResponse = await send(payload)
      const first = await firstResponse.json() as { id: string }
      const retryResponse = await send(payload)
      const retry = await retryResponse.json() as { id: string }
      const conflictResponse = await send({ ...payload, paymentMethod: 'WalletConnect' })
      return { firstStatus: firstResponse.status, retryStatus: retryResponse.status, firstId: first.id, retryId: retry.id, conflictStatus: conflictResponse.status }
    })
    expect(result.firstStatus).toBe(201)
    expect(result.retryStatus).toBe(200)
    expect(result.retryId).toBe(result.firstId)
    expect(result.conflictStatus).toBe(409)
  })

  test('retorna cotação calculada pela API e distingue cupom expirado', async ({ page }) => {
    await login(page, 'thiago@kurio.demo')
    await addFeaturedNftToCart(page)
    const quote = await page.evaluate(async () => {
      const validResponse = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promoCode: 'KURIO10' }) })
      const valid = await validResponse.json() as { valid: boolean; discountEth: string; totalEth: string }
      const expiredResponse = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promoCode: 'KURIOEXPIRED' }) })
      const expired = await expiredResponse.json() as { valid: boolean; reason: string }
      return { valid, expired }
    })
    expect(quote.valid.valid).toBe(true)
    expect(Number(quote.valid.discountEth)).toBeGreaterThan(0)
    expect(Number(quote.valid.totalEth)).toBeGreaterThan(0)
    expect(quote.expired.valid).toBe(false)
    expect(quote.expired.reason).toBe('expired')
  })


  test('protege rotas privadas e redireciona sessão expirada', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
    await login(page, 'thiago@kurio.demo')
    await page.evaluate(() => {
      const raw = localStorage.getItem('kurio-session-v2')
      if (!raw) throw new Error('Sessão de demonstração não encontrada')
      const session = JSON.parse(raw) as Record<string, unknown>
      session.expiresAt = new Date(Date.now() - 1000).toISOString()
      localStorage.setItem('kurio-session-v2', JSON.stringify(session))
    })
    await page.goto('/wallets')
    await expect(page).toHaveURL(/\/login$/)
  })

})
