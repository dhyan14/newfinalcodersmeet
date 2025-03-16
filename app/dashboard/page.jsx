import Features from "@/components/dashboard/Features";
import Footer from "@/components/dashboard/Footer";
import ContactUs from "@/components/dashboard/ContactUs";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {/* ... existing code ... */}
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {/* ... existing code ... */}
        </div>
        <Features />
        <ContactUs id="contact-us" />
      </main>
      <Footer />
    </div>
  );
} 