import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const FAQS: [string, string][] = [
  ['How do I create my digital ID?', 'Sign up, verify your account, then complete the onboarding form with your name, area and work category. Your ID and QR are generated automatically.'],
  ['What does the QR code show?', 'Only non-sensitive details: your name, worker ID, work category, area and issue date. Your phone number stays hidden unless you explicitly allow sharing.'],
  ['What should I do if I find a syringe or broken glass?', 'Do not pick it up by hand. Put on thick gloves, use tongs or a dustpan, place it in a rigid labelled container and report it in the app.'],
  ['Does the AI need the internet?', 'No. AI Saathi uses built-in safety rules and works offline. Internet-connected features such as live centre lookup and sync need a connection.'],
  ['How do points work?', 'You earn points for verified actions: ID creation +50, lessons +25, daily checklist +20, hazard reports +15, collections +10. Every 500 points raises your level.'],
  ['Which schemes am I eligible for?', 'Open Benefits & Schemes. Eligibility is estimated from your work category and area. Always confirm on the official website or at a CSC centre.'],
  ['What happens when I press SOS?', 'Hold for 3 seconds. The app records an alert with your location, shows share links for WhatsApp/SMS and lets you call 112 directly. Offline alerts sync later.'],
  ['How do I reset my password?', 'Use "Forgot password?" on the sign-in screen, enter your email and follow the reset code steps.'],
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Account · Help</div>
        <h1 className="text-2xl font-bold tracking-tight">Help Centre</h1>
        <p className="text-sm text-muted-foreground">Find an answer quickly, or call for human help.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Frequently asked questions</h3>
          </div>
          <div>
            {FAQS.map((item, index) => (
              <div key={index} className="border-b border-dashed last:border-0">
                <button
                  type="button"
                  onClick={() => setOpen(open === index ? null : index)}
                  className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left text-sm font-medium hover:bg-muted/50"
                >
                  <span>{item[0]}</span>
                  <span className="text-muted-foreground">{open === index ? '−' : '+'}</span>
                </button>
                {open === index && (
                  <p className="px-5 pb-3 text-sm text-muted-foreground">{item[1]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Need urgent help?</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['112', 'Police'],
                ['108', 'Ambulance'],
                ['101', 'Fire'],
                ['1091', 'Women'],
              ].map(([num, label]) => (
                <a
                  key={num}
                  href={`tel:${num}`}
                  className="flex flex-col items-center justify-center rounded-xl border bg-muted/40 p-3 hover:bg-muted"
                >
                  <b className="text-lg">{num}</b>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </a>
              ))}
            </div>
            <Link to="/sos">
              <Button variant="destructive" className="mt-3 w-full">
                Open SOS
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Still stuck?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask AI Saathi in Hindi, English or Hinglish. It is available even without internet.
            </p>
            <Link to="/ai">
              <Button className="mt-3 w-full">Ask AI Saathi</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
