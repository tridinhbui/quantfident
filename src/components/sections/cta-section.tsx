import { Section } from "./section";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@quantfident.com";

export function CTASection() {
  return (
    <Section>
      <div className="rounded-3xl border-0 p-16 text-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative z-10">
          <h3 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Ready to start your quant journey?
          </h3>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Contact us to learn more about the QuantFident Mentorship Program
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Email us at:</p>
              <a href={`mailto:${contactEmail}`} className="text-lg font-medium text-primary hover:underline">
                {contactEmail}
              </a>
            </div>
            <div className="hidden sm:block w-px bg-border mx-4"></div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Follow us:</p>
              <div className="flex gap-4 justify-center">
                <a href="https://linkedin.com/company/quantfident" className="text-primary hover:underline">LinkedIn</a>
                <a href="https://twitter.com/quantfident" className="text-primary hover:underline">Twitter</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
