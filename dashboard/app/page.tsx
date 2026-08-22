export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold">
            DevOps Deployment Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            CI/CD Platform Monitoring
          </p>
        </header>

        {/* System Status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <StatusCard
            title="Application"
            status="RUNNING"
          />

          <StatusCard
            title="Docker"
            status="RUNNING"
          />

          <StatusCard
            title="Jenkins"
            status="SUCCESS"
          />

        </section>

        {/* Latest Deployment */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">

          <h2 className="text-xl font-semibold mb-6">
            Latest Deployment
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <Info label="Status" value="SUCCESS" />

            <Info label="Version" value="latest" />

            <Info label="Branch" value="main" />

            <Info label="Build" value="#1" />

          </div>

        </section>

        {/* Container */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">

          <h2 className="text-xl font-semibold mb-6">
            Container
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Info
              label="Container"
              value="devops-platform-cd"
            />

            <Info
              label="Port"
              value="3001 → 3000"
            />

            <Info
              label="Health"
              value="UP"
            />

          </div>

        </section>

        {/* Buttons */}
        <div className="flex gap-4">

          <button className="px-5 py-3 rounded-lg bg-white text-black font-medium">
            Refresh
          </button>

          <button className="px-5 py-3 rounded-lg border border-gray-700">
            View Logs
          </button>

        </div>

      </div>
    </main>
  );
}


/* Status Card */

function StatusCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

      <p className="text-gray-400 mb-3">
        {title}
      </p>

      <div className="flex items-center gap-3">

        <span className="h-3 w-3 rounded-full bg-green-500" />

        <span className="text-xl font-semibold">
          {status}
        </span>

      </div>

    </div>
  );
}


/* Information */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-gray-500 text-sm">
        {label}
      </p>

      <p className="text-lg font-medium mt-1">
        {value}
      </p>

    </div>
  );
}