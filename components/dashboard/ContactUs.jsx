import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactUs({ id }) {
  return (
    <section id={id} className="w-full py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Contact Us</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-4">
            <form className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Input type="email" placeholder="Your email" />
              </div>
              <div className="space-y-2">
                <Textarea placeholder="Your message" className="min-h-[120px]" />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
} 