import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, email: string, password = 'Kurio123!') {
  await page.goto('/login')
  await page.locator('input[aria-label="E-mail"]').fill(email)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
}

async function addFeaturedNftToCart(page: Page) {
  await page.goto('/nft/ape-009')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.locator('p.inline-success')).toContainText('NFT adicionado ao carrinho.')
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
