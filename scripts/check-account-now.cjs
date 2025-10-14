const fetch = require('node-fetch');

async function checkRunPod() {
  const apiKey = process.env.RUNPOD_API_KEY;

  if (!apiKey) {
    console.error('❌ RUNPOD_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🔍 Checking RunPod account...');
  console.log('');

  try {
    // Check pods
    const podsResponse = await fetch('https://api.runpod.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: `query { myself { id email pods { id name desiredStatus costPerHr machineType runtime { uptimeInSeconds } } } }`
      })
    });

    const podsData = await podsResponse.json();

    if (podsData.errors) {
      console.error('❌ API Error:', podsData.errors);
      return;
    }

    const account = podsData.data.myself;
    const pods = account.pods;

    console.log('✅ ACCOUNT CONNECTED');
    console.log(`   Email: ${account.email}`);
    console.log('');

    console.log(`🖥️  PODS: ${pods.length} total`);
    console.log('');

    if (pods.length === 0) {
      console.log('❌ NO PODS FOUND - All were terminated');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Check network volumes: https://runpod.io/console/storage');
      console.log('2. Create new pods: https://runpod.io/console/pods');
      console.log('   → ComfyUI: RTX 4090, 48GB RAM, network volume');
      console.log('   → Agent Terminal: RTX 4090, 128GB RAM, network volume');
      return;
    }

    const runningPods = pods.filter(p => p.desiredStatus === 'RUNNING');
    const stoppedPods = pods.filter(p => p.desiredStatus !== 'RUNNING');

    if (runningPods.length > 0) {
      console.log(`✅ ${runningPods.length} RUNNING POD(S):`);
      console.log('');
      runningPods.forEach(pod => {
        const uptimeHours = pod.runtime ? Math.floor(pod.runtime.uptimeInSeconds / 3600) : 0;
        console.log(`  📦 ${pod.name}`);
        console.log(`     ID: ${pod.id}`);
        console.log(`     Type: ${pod.machineType}`);
        console.log(`     Uptime: ${uptimeHours} hours`);
        console.log(`     Cost: $${pod.costPerHr}/hr`);
        console.log('');
      });

      const totalCost = runningPods.reduce((sum, p) => sum + parseFloat(p.costPerHr), 0);
      console.log(`💰 CURRENT COSTS:`);
      console.log(`   Per hour: $${totalCost.toFixed(2)}`);
      console.log(`   Per day: $${(totalCost * 24).toFixed(2)}`);
      console.log(`   Per month: $${(totalCost * 24 * 30).toFixed(2)}`);
      console.log('');

      console.log('🎯 LOOP 10 CAN BE ENABLED!');
      console.log('');
    }

    if (stoppedPods.length > 0) {
      console.log(`⏸️  ${stoppedPods.length} STOPPED POD(S):`);
      console.log('');
      stoppedPods.forEach(pod => {
        console.log(`  📦 ${pod.name}`);
        console.log(`     ID: ${pod.id}`);
        console.log(`     Status: ${pod.desiredStatus}`);
        console.log(`     Type: ${pod.machineType}`);
        console.log('');
      });

      console.log('💡 These pods can be restarted!');
      console.log(`   Visit: https://runpod.io/console/pods`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkRunPod();
