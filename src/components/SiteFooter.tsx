import type { FormEvent } from 'react'
import '../App.css'

type SiteFooterProps = {
  newsletterMessage?: string
  onNewsletterSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

export function SiteFooter({ newsletterMessage = '', onNewsletterSubmit }: SiteFooterProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onNewsletterSubmit) onNewsletterSubmit(event)
    else event.preventDefault()
  }

  return (
    <>
      <section className="trust-newsletter home-wide" aria-label="Benefícios e novidades">
        <article className="trust-item"><span className="trust-initial">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></article>
        <article className="trust-item"><span className="trust-initial">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></article>
        <article className="trust-item"><span className="trust-initial">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades e listas de acesso antecipado.</p></article>
        <div className="newsletter-box"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={handleSubmit}><label className="sr-only" htmlFor="newsletter-email">Seu e-mail</label><input id="newsletter-email" type="email" placeholder="digite seu e-mail..." required /><button type="submit">Enviar</button></form><p>{newsletterMessage || 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}</p></div>
      </section>

      <footer className="site-footer" id="footer">
        <div className="footer-brand-row"><a className="brand" href="#inicio">KURIO<span>.</span></a><p>Feito para colecionadores,<br />criadores e cultura</p><a href="mailto:contato@email.com">contato@email.com</a><span>+55 11 4002 8922</span></div>
        <div className="footer-columns">
          <div><h3>Meu perfil</h3><a href="#inicio">Meu perfil</a><a href="#inicio">Minha coleção</a><a href="#inicio">Atividade</a><a href="#criadores">Estúdio do criador</a><a href="#mercado">Lista de interesse</a></div>
          <div><h3>Central de ajuda</h3><a href="#aprenda">Central de ajuda</a><a href="#aprenda">Como comprar NFTs</a><a href="#aprenda">Carteira e segurança</a><a href="#aprenda">Política de mercado</a><a href="#aprenda">Denunciar item</a></div>
          <div><h3>Coleções</h3><a href="#mercado">Arte digital</a><a href="#mercado">Fotografia</a><a href="#mercado">Música</a><a href="#mercado">Arte 3D</a><a href="#mercado">Utilidade</a></div>
          <div><h3>Redes sociais</h3><div className="social-links"><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://instagram.com" aria-label="Instagram">◎</a><a href="https://twitter.com" aria-label="Twitter">♥</a><a href="https://linkedin.com" aria-label="LinkedIn">in</a><a href="https://youtube.com" aria-label="YouTube">▶</a></div><h3 className="wallet-title">Carteiras compatíveis</h3><div className="wallet-tags"><span>METAMASK</span><span>WALLETCONNECT</span><span>COINBASE</span></div></div>
        </div>
        <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      </footer>
    </>
  )
}
