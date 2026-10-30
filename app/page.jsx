import Link from "next/link";
import Services from "@/components/Services";

export const metadata = {
  title: "Khetan Dental Care | Dr. Prachi Khetan (BDS) - Raha, Nagaon",
  description: "Gentle, modern dental clinic in Raha, Nagaon, Assam. Dental implants, painless root canals, scaling, dentures and orthodontic treatment with Dr. Prachi Khetan.",
};

export default function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-mist/80 via-mist/30 to-white px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 text-teal text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse"></span>
              Dr. Prachi Khetan, BDS · Raha New Charali
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-ink tracking-tight leading-[1.05]">
              Dental implants & gentle dentistry, <span className="text-teal">done right in Raha.</span>
            </h1>
            <p className="mt-6 text-base sm:text-xl text-ink/80 leading-relaxed font-normal">
              From painless root canals and tooth-saving restorations to permanent dental implants and orthodontic smile alignment—experience compassionate dental care with upfront, transparent prices.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/book"
                className="px-8 py-3.5 rounded-lg bg-ink text-white font-bold text-base hover:bg-ink/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Book Appointment Online
              </Link>
              <a
                href="tel:9101616156"
                className="px-6 py-3.5 rounded-lg bg-white border border-ink/20 text-ink font-bold text-base hover:bg-mist transition-all flex items-center gap-2"
              >
                <span>📞</span> Call 9101616156
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-ink/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-ink/75">
              <div className="flex items-center gap-2">
                <span className="text-teal text-base">✓</span> 100% Painless Anesthetics
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal text-base">✓</span> Fellowship in Implants
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal text-base">✓</span> Autoclaved Sterilization
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal text-base">✓</span> Clear Fixed Pricing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT DOCTOR SECTION */}
      <section id="doctor" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-mist">
        <div className="grid md:grid-cols-[1fr_1.8fr] gap-12 items-center">
          <div className="bg-mist/70 p-8 rounded-3xl border border-mist text-center space-y-4">
            <div className="w-32 h-32 mx-auto rounded-full bg-teal text-white flex items-center justify-center text-5xl shadow-md border-4 border-white font-serif">
              👩‍⚕️
            </div>
            <div>
              <h3 className="text-2xl font-black text-ink">Dr. Prachi Khetan</h3>
              <p className="text-sm font-semibold text-teal mt-0.5">BDS, RUHS Jaipur</p>
              <p className="text-xs text-ink/60 mt-1">Top-3 Rank Holder in Batch</p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold text-ink/70">
              <span className="bg-white px-2.5 py-1 rounded-full border border-mist">Implantology Fellow</span>
              <span className="bg-white px-2.5 py-1 rounded-full border border-mist">Impaction Specialist</span>
              <span className="bg-white px-2.5 py-1 rounded-full border border-mist">Intraoral Scanning</span>
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-xs font-bold text-teal tracking-widest uppercase bg-teal/10 px-3 py-1 rounded-full">
              Meet Your Dentist
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
              A sympathetic listener who explains every step before treatment.
            </h2>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
              Dental visits shouldn't be intimidating. Dr. Prachi Khetan believes in gentle care, taking the time to listen to your dental symptoms, understand your concerns, and explain procedures in plain, clear language.
            </p>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
              Graduated with top academic honors from the prestigious Rajasthan University of Health Sciences, Dr. Khetan has pursued advanced fellowships in surgical impaction and dental implantology, bringing modern metropolitan dental standards right to Raha, Nagaon.
            </p>

            <div className="bg-white p-5 rounded-xl border border-mist/80 space-y-2 text-xs text-ink/70">
              <div className="flex items-start gap-2">
                <span className="font-bold text-ink">Clinic:</span>
                <span>Raha New Charali, near Assam Gramin Vikas Bank, near Shankar Cycle Store, Raha, Nagaon, Assam 782103</span>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <a href="tel:9101616156" className="text-teal font-bold hover:underline">
                  📞 9101616156
                </a>
                <span>·</span>
                <span className="font-medium text-ink">dr.prachikhetan.bds18@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES & PRICING */}
      <Services />

      {/* WHY CHOOSE US / HIGHLIGHTS */}
      <section className="bg-mist/40 py-20 px-4 sm:px-6 border-t border-b border-mist">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-ink">Modern Dental Standards in Raha</h2>
            <p className="text-sm text-ink/70 mt-2">
              Every detail is designed around patient hygiene, comfort, and clinical accuracy.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="font-bold text-ink text-base">Sterilization Protocol</h4>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Hospital-grade autoclave sterilization for all surgical and restorative instruments to prevent cross-infection.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
              <div className="text-3xl mb-3">🔍</div>
              <h4 className="font-bold text-ink text-base">Digital Scanning</h4>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                High-precision intraoral digital scanning and putty impressions for exact fitting crowns, bridges, and dentures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
              <div className="text-3xl mb-3">💉</div>
              <h4 className="font-bold text-ink text-base">Painless Procedures</h4>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Advanced topical numbing gels and fine-gauge anesthesia so even root canals and extractions are virtually painless.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
              <div className="text-3xl mb-3">🤝</div>
              <h4 className="font-bold text-ink text-base">Zero Surprises</h4>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                We confirm exact treatment fees with you during your initial consultation before beginning any procedure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PATIENT REVIEWS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal uppercase tracking-widest bg-teal/10 px-3 py-1 rounded-full">
            Patient Stories
          </span>
          <h2 className="text-3xl font-extrabold text-ink mt-3">What Our Patients Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm space-y-3">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-sm text-ink/80 italic">
              "I was terrified of getting a root canal done. Dr. Prachi explained each step so calmly and the entire procedure was completely painless. Highly recommended in Raha!"
            </p>
            <div className="text-xs font-bold text-ink pt-2 border-t border-mist">
              – Anupam B., Raha
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm space-y-3">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-sm text-ink/80 italic">
              "Got teeth cleaning and a composite filling done. The clinic is extremely clean, equipment is modern, and pricing is very reasonable with no hidden costs."
            </p>
            <div className="text-xs font-bold text-ink pt-2 border-t border-mist">
              – Dimpal K., Nagaon
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm space-y-3">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-sm text-ink/80 italic">
              "Booking an appointment online was seamless. We didn't have to wait in a crowded clinic. Dr. Prachi is very patient with elderly patients."
            </p>
            <div className="text-xs font-bold text-ink pt-2 border-t border-mist">
              – Ramesh S., Chaparmukh
            </div>
          </div>
        </div>
      </section>

      {/* CLINIC TIMINGS & LOCATION CARD */}
      <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-mist">
        <div className="bg-gradient-to-br from-mist/70 to-mist/30 rounded-3xl p-8 sm:p-12 border border-mist grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-teal uppercase tracking-widest bg-teal/10 px-3 py-1 rounded-full">
              Visit Us
            </span>
            <h3 className="text-3xl font-extrabold text-ink">Clinic Timings & Directions</h3>
            <p className="text-sm text-ink/75 leading-relaxed">
              Located conveniently at Raha New Charali, right near Assam Gramin Vikas Bank and Shankar Cycle Store.
            </p>

            <div className="space-y-2 text-sm pt-2">
              <div className="flex justify-between py-1.5 border-b border-ink/10">
                <span className="font-semibold text-ink">Monday – Saturday</span>
                <span className="text-teal font-bold">10:00 AM – 1:30 PM & 4:00 PM – 7:30 PM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-ink/10">
                <span className="font-semibold text-ink">Sunday</span>
                <span className="text-teal font-bold">10:00 AM – 1:30 PM (Morning Only)</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href="https://maps.google.com/?q=Raha+New+Charali+Nagaon+Assam+782103"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-ink text-white font-bold text-sm hover:bg-ink/90 shadow-sm"
              >
                🗺️ Get Google Maps Directions
              </a>
              <a
                href="tel:9101616156"
                className="px-5 py-2.5 rounded-lg border border-ink/30 text-ink font-bold text-sm hover:bg-white"
              >
                Call Reception
              </a>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-mist shadow-md space-y-4">
            <h4 className="font-bold text-ink text-lg">Contact Information</h4>
            <div className="space-y-3 text-sm text-ink/80">
              <div>
                <span className="text-xs text-ink/50 block font-medium">Head Dentist:</span>
                <span className="font-bold text-ink">Dr. Prachi Khetan (BDS RUHS)</span>
              </div>
              <div>
                <span className="text-xs text-ink/50 block font-medium">Phone & WhatsApp:</span>
                <a href="tel:9101616156" className="font-bold text-teal text-base hover:underline block">
                  +91 9101616156
                </a>
              </div>
              <div>
                <span className="text-xs text-ink/50 block font-medium">Email:</span>
                <span className="font-medium text-ink">dr.prachikhetan.bds18@gmail.com</span>
              </div>
              <div>
                <span className="text-xs text-ink/50 block font-medium">Address:</span>
                <span className="text-xs text-ink/80 block mt-0.5 leading-relaxed">
                  Raha New Charali, Near Assam Gramin Vikas Bank & Shankar Cycle Store, Raha, Nagaon, Assam – 782103
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-mist bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-ink/60">
          <div>
            <span className="font-extrabold text-ink text-base">Khetan Dental Care</span>
            <p className="text-xs mt-1">Dedicated to gentle oral healthcare in Raha, Nagaon, Assam.</p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-semibold text-ink/80">
            <Link href="/#services" className="hover:text-teal">Services & Pricing</Link>
            <Link href="/#doctor" className="hover:text-teal">About Doctor</Link>
            <Link href="/book" className="hover:text-teal">Book Visit</Link>
            <Link href="/login" className="hover:text-teal">Patient & Staff Login</Link>
          </div>

          <div className="text-xs text-ink/50">
            © {new Date().getFullYear()} Khetan Dental Care. All rights reserved.
          </div>
        </div>
      </footer>

      {/* FLOATING QUICK CONTACT (Mobile & Desktop) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5">
        <a
          href="https://wa.me/919101616156?text=Hello%20Dr.%20Prachi,%20I%20would%20like%20to%20inquire%20about%20dental%20treatment."
          target="_blank"
          rel="noopener noreferrer"
          className="w-13 h-13 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
          title="Chat with clinic on WhatsApp"
        >
          <span className="text-base">💬</span>
          <span className="hidden sm:inline">WhatsApp Us</span>
        </a>
      </div>
    </>
  );
}
