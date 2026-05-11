export default function HomePage() {
  const features = [
    {
      title: 'OID4VCI Credential Issuance',
      desc: 'Issue W3C Verifiable Credentials using OpenID4VCI standards.',
    },
    {
      title: 'JWT & SD-JWT Support',
      desc: 'Generate interoperable JWT VCs and privacy-preserving SD-JWT credentials.',
    },
    {
      title: 'Multi-DID Support',
      desc: 'Compatible with did:key, did:jwk, did:web, and did:cheqd methods.',
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
            Built with walt.id
          </div>

          <h1 className="text-6xl font-bold tracking-tight">
            Verifiable Credential Infrastructure
          </h1>

          <p className="mt-6 text-lg text-zinc-400 leading-8">
            A modern verifiable credential platform powered by walt.id, OpenID4VCI,
            JWT VC, and SD-JWT issuance flows.
          </p>

          <div className="mt-10 flex gap-4">
            <a
              href="https://github.com/didoneworld/verifiable-credential"
              className="rounded-2xl bg-white px-6 py-3 font-medium text-black"
            >
              View Repository
            </a>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-zinc-900 p-8"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-4 text-zinc-400 leading-7">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
