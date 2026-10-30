"use client";

import Link from "next/link";

const SERVICE_CATEGORIES = [
  {
    category: "Preventive & General Care",
    description: "Routine checkups, hygiene, and immediate cavity restorations.",
    services: [
      {
        name: "OPD Consultation & Dental Exam",
        price: "₹300",
        description: "Comprehensive oral examination, digital intraoral camera inspection, and treatment planning.",
        tag: "Initial Visit",
      },
      {
        name: "Teeth Cleaning & Scaling",
        price: "₹1,500 – ₹2,000",
        description: "Ultrasonic tartar removal, plaque cleaning, and gentle polish for healthy gums.",
        tag: "Preventive",
      },
      {
        name: "Tooth Filling (Composite & GIC)",
        price: "₹500 – ₹1,000",
        description: "Tooth-colored, natural-looking composite restorations that seal decay seamlessly.",
        tag: "Restorative",
      },
    ],
  },
  {
    category: "Advanced Endodontics & Implants",
    description: "Painless tooth saving and permanent tooth replacement technology.",
    services: [
      {
        name: "Root Canal Treatment (RCT)",
        price: "₹3,000",
        description: "Single-sitting or multi-sitting painless root canal under modern local anesthesia.",
        tag: "Pain Relief",
      },
      {
        name: "Dental Implants",
        price: "Consultation Based",
        description: "Titanium implant posts for single or multiple missing teeth with natural look and feel.",
        tag: "Fellowship Certified",
      },
      {
        name: "Surgical Extraction & Impaction",
        price: "₹1,200 – ₹6,000",
        description: "Safe wisdom tooth removal and impaction surgery with gentle post-op recovery care.",
        tag: "Oral Surgery",
      },
    ],
  },
  {
    category: "Prosthodontics, Dentures & Braces",
    description: "Restoring chewing ability, smiles, and proper bite alignment.",
    services: [
      {
        name: "Fixed Partial Denture (FPD / Bridge)",
        price: "Custom Estimate",
        description: "Permanent ceramic / zirconia bridges that anchor securely to replace missing teeth.",
        tag: "Prosthodontics",
      },
      {
        name: "Complete & Partial Dentures (CD / RPD)",
        price: "Case Dependent",
        description: "Comfort-fit removable acrylic or flexible dentures tailored for senior patients.",
        tag: "Full Restoration",
      },
      {
        name: "Orthodontic Braces & Alignment",
        price: "Consultation Based",
        description: "Correction of crooked teeth, spacing, and bite alignment for teens and adults.",
        tag: "Orthodontics",
      },
      {
        name: "In-Clinic Teeth Whitening",
        price: "₹2,000",
        description: "Safe enamel whitening that removes tough tobacco, tea, and aging stains in one visit.",
        tag: "Cosmetic",
      },
    ],
  },
];

export default function Services() {
  return (
    <section id="services" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold text-teal tracking-widest uppercase bg-teal/10 px-3 py-1 rounded-full">
          Transparent Dental Pricing
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-ink mt-3">
          Dental Services & Clear Pricing
        </h2>
        <p className="mt-3 text-ink/70 text-sm sm:text-base">
          No hidden charges or surprise bills. Every procedure is explained thoroughly before you sit back in the chair.
        </p>
      </div>

      <div className="space-y-12">
        {SERVICE_CATEGORIES.map((cat, idx) => (
          <div key={idx} className="bg-mist/30 rounded-2xl p-6 sm:p-8 border border-mist">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-ink">{cat.category}</h3>
              <p className="text-sm text-ink/70 mt-1">{cat.description}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.services.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white rounded-xl p-6 border border-mist shadow-sm flex flex-col justify-between hover:shadow-md hover:border-teal/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded">
                        {s.tag}
                      </span>
                      <span className="text-sm font-extrabold text-ink">{s.price}</span>
                    </div>
                    <h4 className="text-base font-bold text-ink mt-2">{s.name}</h4>
                    <p className="text-xs text-ink/70 mt-2 leading-relaxed">{s.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-mist/80 flex items-center justify-between">
                    <span className="text-xs text-ink/50">Dr. Prachi Khetan</span>
                    <Link
                      href="/book"
                      className="text-xs font-bold text-teal hover:text-teal/80 transition-colors flex items-center gap-1"
                    >
                      Book Visit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Special Highlights Banner */}
      <div className="mt-12 bg-gradient-to-r from-ink to-[#1a3840] text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-lg">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs uppercase font-extrabold tracking-wider text-teal bg-white/10 px-2.5 py-1 rounded">
            Specialized Care in Raha
          </span>
          <h3 className="text-2xl font-bold">Have an acute toothache or broken filling?</h3>
          <p className="text-white/80 text-sm">
            Emergency same-day slots and walk-ins are accommodated. Call our clinic reception directly or book your slot online.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="px-6 py-3 rounded-lg bg-teal text-white font-bold text-sm hover:bg-teal/90 transition-all shadow-md"
          >
            Book Appointment
          </Link>
          <a
            href="tel:9101616156"
            className="px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all"
          >
            Call 9101616156
          </a>
        </div>
      </div>
    </section>
  );
}
