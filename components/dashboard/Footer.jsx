export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © 2023 Your Company. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <a href="#" className="text-sm font-medium hover:underline">
            Terms of Service
          </a>
          <a href="#" className="text-sm font-medium hover:underline">
            Privacy
          </a>
          <a href="#contact-us" className="text-sm font-medium hover:underline">
            Contact Us
          </a>
        </nav>
      </div>
    </footer>
  );
} 