import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-container">
        <p className="home-footer-text">
          Powered by 跨境风控 | <Link href="#">使用条款</Link> | <Link href="#">隐私政策</Link>
        </p>
      </div>
    </footer>
  );
}