import { EcosystemStatusPanel } from './components/EcosystemStatusPanel';
import RealTimeRegistry from './components/monitoring/RealTimeRegistry';

export default function Home() {
  return (
    <div className="space-y-8 p-6">
      {/* Ecosystem Status - Homepage Hero */}
      <EcosystemStatusPanel />

      {/* Real-Time Registry */}
      <RealTimeRegistry />
    </div>
  );
}
