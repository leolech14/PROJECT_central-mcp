/**
 * 🌐 MACHINES MAP V2.0 HTML GENERATOR - SOPHISTICATED EDITION
 * ==========================================================
 *
 * ULTRATHINK EVOLUTION - Advanced Visual Reporting System
 *
 * This system generates stunning, interactive HTML reports for the
 * Machines Map V2.0 analysis with sophisticated styling, animations,
 * and comprehensive data visualization capabilities.
 *
 * Features:
 * - Glassmorphic design with CSS variables
 * - Interactive animations and transitions
 * - Comprehensive data visualization
 * - Responsive design for all screen sizes
 * - Advanced color theming system
 * - Professional typography and spacing
 */

import { MachinesMapV2Data } from './getMachinesMapV2.js';
import { writeFileSync } from 'fs';
import path from 'path';

export class MachinesMapV2HTMLGenerator {
  private data: MachinesMapV2Data;
  private outputPath: string;

  constructor(data: MachinesMapV2Data, outputPath: string) {
    this.data = data;
    this.outputPath = outputPath;
  }

  /**
   * Generate comprehensive HTML report
   */
  generateHTMLReport(): string {
    const html = this.createHTMLDocument();
    writeFileSync(this.outputPath, html, 'utf8');
    return this.outputPath;
  }

  /**
   * Create complete HTML document with sophisticated styling
   */
  private createHTMLDocument(): string {
    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>🌐 Machines Map V2.0 Analysis - ${this.data.localSystem.name} + ${this.data.remoteSystem.name}</title>
<style>
  :root{
    --bg: oklch(0.96 0.01 250);
    --surface: oklch(1 0.01 250);
    --surface-2: oklch(0.98 0.01 250);
    --text: oklch(0.15 0.02 250);
    --muted: oklch(0.45 0.02 250);
    --border: oklch(0.85 0.02 250);
    --accent: oklch(0.65 0.08 240);
    --text-primary: oklch(0.15 0.02 250);
    --text-secondary: oklch(0.45 0.02 250);
    --text-on-surface: oklch(0.15 0.02 250);
    --text-on-accent: oklch(1 0 0);
    --success: oklch(73% 0.15 166);
    --warning: oklch(65% 0.12 75);
    --danger: oklch(58% 0.18 25);
    --multi-cloud: oklch(0.60 0.18 200);
    --predictive: oklch(0.65 0.15 280);
    --remediation: oklch(0.55 0.12 150);
    --cost-optimization: oklch(0.70 0.10 60);
    --security: oklch(0.60 0.14 320);
    --performance: oklch(0.62 0.16 40);
    --radius: 12px;
    --ui: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 350ms;
    --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
    --shadow-lg: 0 10px 15px -3px var(--black-30), 0 4px 6px -4px var(--black-30);
    --shadow-xl: 0 20px 25px -5px var(--black-30), 0 8px 10px -6px var(--black-30);
    --shadow-2xl: 0 25px 50px -12px var(--black-50);
  }

  html, body{height:100%}
  body{margin:0;background:var(--bg);color:var(--text);font-family:var(--ui);-webkit-font-smoothing:antialiased;line-height:1.6}

  @keyframes shine{0%{box-shadow:0 0 0 0 var(--accent)}50%{box-shadow:0 0 40px 15px var(--accent),inset 0 0 20px 5px var(--accent)}100%{box-shadow:0 0 0 0 var(--accent)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
  @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  .shine-animation{animation:shine 2s ease-in-out}
  .pulse-animation{animation:pulse 2s infinite}
  .slide-in{animation:slideIn 0.5s ease-out}

  .gradient-header{
    background:linear-gradient(135deg, var(--multi-cloud) 0%, var(--predictive) 25%, var(--remediation) 50%, var(--cost-optimization) 75%, var(--security) 100%);
    color:var(--white);
    padding:32px;
    border-radius:var(--radius);
    margin-bottom:24px;
    box-shadow:var(--shadow-xl);
  }

  .v2-banner{
    background:linear-gradient(45deg, var(--predictive), var(--multi-cloud));
    color:var(--white);
    padding:16px 24px;
    border-radius:8px;
    margin-bottom:24px;
    font-weight:600;
    text-align:center;
    box-shadow:var(--shadow-lg);
  }

  .wrap{max-width:1400px;margin:24px auto;padding:0 16px 72px}

  h1{font-size:clamp(28px,4vw,42px);margin:0;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.1)}
  h2{font-size:clamp(22px,3vw,32px);margin:32px 0 16px;font-weight:600}
  h3{font-size:clamp(18px,2.5vw,24px);margin:24px 0 12px;font-weight:600}

  .lead{color:var(--muted);margin:8px 0 0;font-size:clamp(16px,2vw,18px)}

  .grid{display:grid;gap:16px}
  .cols-2{grid-template-columns:repeat(2,1fr)}
  .cols-3{grid-template-columns:repeat(3,1fr)}
  .cols-4{grid-template-columns:repeat(4,1fr)}

  @media (max-width: 768px) {
    .cols-2, .cols-3, .cols-4{grid-template-columns:1fr}
  }

  .card{
    background:var(--surface);
    border:1px solid var(--border);
    border-radius:var(--radius);
    padding:24px;
    margin-bottom:24px;
    box-shadow:var(--shadow-md);
    transition:all var(--duration-normal) var(--easing-standard);
  }

  .card:hover{
    transform:translateY(-2px);
    box-shadow:var(--shadow-xl);
  }

  .card h2{margin:0 0 16px;font-size:20px}
  .card h3{margin:16px 0 8px;font-size:16px}

  .metric-card{
    background:var(--surface-2);
    padding:20px;
    border-radius:var(--radius);
    text-align:center;
    box-shadow:var(--shadow-sm);
    transition:all var(--duration-normal) var(--easing-standard);
    border:1px solid var(--border);
  }

  .metric-card:hover{
    transform:scale(1.02);
    box-shadow:var(--shadow-lg);
  }

  .metric-value{
    font-size:2.5rem;
    font-weight:700;
    font-family:var(--mono);
    display:block;
    line-height:1;
  }

  .metric-label{
    color:var(--muted);
    font-size:14px;
    font-weight:500;
    margin-top:4px;
  }

  .status-badge{
    display:inline-block;
    padding:6px 12px;
    border-radius:999px;
    font-size:12px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:0.5px;
  }

  .status-success{background:var(--success);color:var(--white)}
  .status-warning{background:var(--warning);color:var(--white)}
  .status-danger{background:var(--danger);color:var(--white)}
  .status-info{background:var(--accent);color:var(--white)}

  .multi-cloud-badge{background:var(--multi-cloud);color:var(--white)}
  .predictive-badge{background:var(--predictive);color:var(--white)}
  .remediation-badge{background:var(--remediation);color:var(--white)}
  .cost-badge{background:var(--cost-optimization);color:var(--white)}
  .security-badge{background:var(--security);color:var(--white)}
  .performance-badge{background:var(--performance);color:var(--white)}

  .table{
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    border:1px solid var(--border);
    border-radius:8px;
    background:var(--surface);
    overflow:hidden;
  }

  .table th,.table td{
    padding:12px;
    text-align:left;
    vertical-align:top;
    border-bottom:1px solid var(--border);
  }

  .table thead th{
    background:var(--surface-2);
    font-weight:600;
    color:var(--text);
  }

  .table tbody tr:last-child td{border-bottom:none}
  .table tbody tr:hover{background:var(--surface-2)}

  .progress-bar{
    width:100%;
    height:8px;
    background:var(--surface-2);
    border-radius:4px;
    overflow:hidden;
    margin:4px 0;
  }

  .progress-fill{
    height:100%;
    border-radius:4px;
    transition:width var(--duration-slow) var(--easing-standard);
  }

  .progress-success{background:var(--success)}
  .progress-warning{background:var(--warning)}
  .progress-danger{background:var(--danger)}
  .progress-info{background:var(--accent)}

  .alert{
    padding:16px;
    border-radius:8px;
    margin-bottom:16px;
    border-left:4px solid;
  }

  .alert-critical{
    background:oklch(58% 0.18 25 / 0.1);
    border-left-color:var(--danger);
    color:var(--danger);
  }

  .alert-warning{
    background:oklch(65% 0.12 75 / 0.1);
    border-left-color:var(--warning);
    color:var(--warning);
  }

  .alert-info{
    background:oklch(0.65 0.08 240 / 0.1);
    border-left-color:var(--accent);
    color:var(--accent);
  }

  .insight-card{
    background:linear-gradient(135deg, var(--surface-2), var(--surface));
    border:1px solid var(--border);
    border-radius:var(--radius);
    padding:20px;
    margin-bottom:16px;
    position:relative;
    overflow:hidden;
  }

  .insight-card::before{
    content:'';
    position:absolute;
    top:0;
    left:0;
    right:0;
    height:4px;
    background:var(--predictive);
  }

  .remediation-card::before{background:var(--remediation)}
  .cost-card::before{background:var(--cost-optimization)}
  .security-card::before{background:var(--security)}
  .performance-card::before{background:var(--performance)}

  .v2-feature-highlight{
    background:linear-gradient(45deg, var(--predictive), var(--multi-cloud));
    color:var(--white);
    padding:2px 8px;
    border-radius:4px;
    font-size:11px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:0.5px;
  }

  .provider-logo{
    width:24px;
    height:24px;
    border-radius:4px;
    display:inline-block;
    margin-right:8px;
    vertical-align:middle;
  }

  .aws-logo{background:#FF9900}
  .azure-logo{background:#0078D4}
  .gcp-logo{background:#4285F4}
  .docker-logo{background:#2496ED}

  .flex-row{display:flex;gap:16px;flex-wrap:wrap}
  .flex-center{display:flex;align-items:center;gap:8px}
  .flex-between{display:flex;justify-content:space-between;align-items:center}

  .text-center{text-align:center}
  .text-right{text-align:right}

  .mono{font-family:var(--mono);font-size:0.9em;background:var(--surface-2);padding:2px 6px;border-radius:4px}

  .footer{
    text-align:center;
    padding:32px;
    margin-top:48px;
    border-top:1px solid var(--border);
    color:var(--muted);
    font-size:14px;
  }

  .generated-at{
    background:var(--surface-2);
    padding:8px 16px;
    border-radius:6px;
    display:inline-block;
    font-family:var(--mono);
    font-size:12px;
  }
</style>
</head>
<body>
<div class="wrap">

  <!-- V2.0 Header -->
  <div class="gradient-header">
    <h1>🌐 Machines Map V2.0 Analysis</h1>
    <p class="lead">ULTRATHINK EVOLUTION - Next-Generation Infrastructure Intelligence</p>
    <div class="flex-row" style="margin-top:16px;">
      <span class="v2-feature-highlight">Multi-Cloud</span>
      <span class="v2-feature-highlight">Predictive AI</span>
      <span class="v2-feature-highlight">Self-Healing</span>
      <span class="v2-feature-highlight">Cost Intelligence</span>
      <span class="v2-feature-highlight">Security AI</span>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="card">
    <h2>📊 Executive Summary</h2>
    <div class="grid cols-4">
      <div class="metric-card">
        <div class="metric-value status-${this.getHealthStatusClass(this.data.healthScores.overall)}">${this.data.healthScores.overall}</div>
        <div class="metric-label">Overall Health Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.multiCloudResources.length}</div>
        <div class="metric-label">Multi-Cloud Providers</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.predictiveInsights.length}</div>
        <div class="metric-label">AI Predictions</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">$${this.data.costOptimization.totalMonthlySavings.toFixed(0)}</div>
        <div class="metric-label">Monthly Savings Potential</div>
      </div>
    </div>
  </div>

  <!-- V2.0 Features Overview -->
  <div class="v2-banner">
    🚀 V2.0 EVOLUTION: From monitoring to autonomous, predictive infrastructure management
  </div>

  <!-- Multi-Cloud Resources -->
  <div class="card">
    <h2>🌐 Multi-Cloud Infrastructure Analysis</h2>
    <div class="grid cols-2">
      ${this.data.multiCloudResources.map(resource => this.generateMultiCloudCard(resource)).join('')}
    </div>
  </div>

  <!-- Predictive Analytics -->
  <div class="card">
    <h2>🧠 Predictive Analytics - AI-Powered Insights</h2>
    ${this.data.predictiveInsights.length > 0 ?
      this.data.predictiveInsights.map(insight => this.generatePredictiveInsightCard(insight)).join('') :
      '<p class="text-center" style="color: var(--muted);">No predictive insights generated at this time.</p>'
    }
  </div>

  <!-- Automated Remediation -->
  <div class="card">
    <h2>🔧 Automated Remediation - Self-Healing Infrastructure</h2>
    ${this.data.automatedRemediation.length > 0 ?
      this.data.automatedRemediation.map(action => this.generateRemediationCard(action)).join('') :
      '<p class="text-center" style="color: var(--muted);">No remediation actions required at this time.</p>'
    }
  </div>

  <!-- Cost Optimization -->
  <div class="card">
    <h2>💰 Cost Optimization Intelligence</h2>
    <div class="grid cols-2">
      <div class="metric-card cost-card">
        <div class="metric-value">$${this.data.costOptimization.totalMonthlySavings.toFixed(2)}</div>
        <div class="metric-label">Total Monthly Savings</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.costOptimization.optimizationActions.length}</div>
        <div class="metric-label">Optimization Actions</div>
      </div>
    </div>

    ${this.data.costOptimization.optimizationActions.length > 0 ? `
      <h3 style="margin-top: 24px;">💡 Cost Optimization Opportunities</h3>
      <div class="table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Action</th>
            <th>Monthly Savings</th>
            <th>Complexity</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          ${this.data.costOptimization.optimizationActions.map(action => `
            <tr>
              <td><span class="mono">${action.resourceId}</span></td>
              <td>${action.action}</td>
              <td><strong>$${action.monthlySavings.toFixed(2)}</strong></td>
              <td><span class="status-badge status-info">${action.implementationComplexity}</span></td>
              <td><span class="status-badge ${action.riskLevel === 'low' ? 'status-success' : action.riskLevel === 'medium' ? 'status-warning' : 'status-danger'}">${action.riskLevel}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </div>
    ` : ''}
  </div>

  <!-- Security Assessment -->
  <div class="card">
    <h2>🔐 Security Intelligence Assessment</h2>
    <div class="grid cols-4">
      <div class="metric-card security-card">
        <div class="metric-value status-${this.getSecurityStatusClass(this.data.securityPosture.overallScore)}">${this.data.securityPosture.overallScore}</div>
        <div class="metric-label">Security Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.securityPosture.vulnerabilities.length}</div>
        <div class="metric-label">Vulnerabilities</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.securityPosture.complianceStatus.length}</div>
        <div class="metric-label">Compliance Checks</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.securityPosture.threatIndicators.length}</div>
        <div class="metric-label">Threat Indicators</div>
      </div>
    </div>

    ${this.data.securityPosture.vulnerabilities.length > 0 ? `
      <h3 style="margin-top: 24px;">🚨 Security Vulnerabilities</h3>
      ${this.data.securityPosture.vulnerabilities.slice(0, 5).map(vuln => `
        <div class="alert alert-${vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'warning' : 'info'}">
          <strong>${vuln.severity.toUpperCase()}:</strong> ${vuln.description}
          <span style="float: right;"><span class="mono">${vuln.resource}</span></span>
        </div>
      `).join('')}
    ` : ''}
  </div>

  <!-- Performance Analytics -->
  <div class="card">
    <h2>📈 Performance Analytics & Benchmarks</h2>
    <div class="grid cols-4">
      <div class="metric-card performance-card">
        <div class="metric-value status-${this.getPerformanceStatusClass(this.data.performanceAnalytics.overallScore)}">${this.data.performanceAnalytics.overallScore}</div>
        <div class="metric-label">Performance Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.performanceAnalytics.trends.length}</div>
        <div class="metric-label">Performance Trends</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.performanceAnalytics.bottlenecks.length}</div>
        <div class="metric-label">Bottlenecks</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.performanceAnalytics.optimizationOpportunities.length}</div>
        <div class="metric-label">Optimizations</div>
      </div>
    </div>

    ${this.data.performanceAnalytics.benchmarks.length > 0 ? `
      <h3 style="margin-top: 24px;">🏆 Performance Benchmarks</h3>
      <div class="table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Current</th>
            <th>Industry Average</th>
            <th>Top Performer</th>
            <th>Ranking</th>
          </tr>
        </thead>
        <tbody>
          ${this.data.performanceAnalytics.benchmarks.map(benchmark => `
            <tr>
              <td><strong>${benchmark.category}</strong></td>
              <td>${benchmark.currentValue}%</td>
              <td>${benchmark.industryAverage}%</td>
              <td>${benchmark.topPerformer}%</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill ${this.getPerformanceProgressClass(benchmark.ranking)}" style="width: ${benchmark.ranking}%"></div>
                </div>
                <small>${benchmark.ranking}/100</small>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </div>
    ` : ''}
  </div>

  <!-- Original Systems Analysis -->
  <div class="card">
    <h2>🖥️ System Health Analysis</h2>
    <div class="grid cols-2">
      <div>
        <h3>${this.data.localSystem.name}</h3>
        <div class="metric">
          <div class="metric-value status-${this.getHealthStatusClass(this.data.healthScores.local)}">${this.data.healthScores.local}</div>
          <div class="metric-label">Health Score</div>
        </div>
        <div class="progress-bar" style="margin-top: 16px;">
          <div class="progress-fill ${this.getStorageProgressClass(this.data.localSystem.storage.utilization)}" style="width: ${this.data.localSystem.storage.utilization}%"></div>
        </div>
        <small>Storage: ${this.data.localSystem.storage.utilization}% used</small>
      </div>

      <div>
        <h3>${this.data.remoteSystem.name}</h3>
        <div class="metric">
          <div class="metric-value status-${this.getHealthStatusClass(this.data.healthScores.remote)}">${this.data.healthScores.remote}</div>
          <div class="metric-label">Health Score</div>
        </div>
        <div class="progress-bar" style="margin-top: 16px;">
          <div class="progress-fill ${this.getStorageProgressClass(this.data.remoteSystem.storage.utilization)}" style="width: ${this.data.remoteSystem.storage.utilization}%"></div>
        </div>
        <small>Storage: ${this.data.remoteSystem.storage.utilization}% used</small>
      </div>
    </div>
  </div>

  <!-- Network Status -->
  <div class="card">
    <h2>🌐 Network Connectivity Status</h2>
    <div class="grid cols-3">
      <div class="metric-card">
        <div class="metric-value status-${this.data.networkConnectivity.status === 'connected' ? 'success' : 'warning'}">${this.data.networkConnectivity.latency}ms</div>
        <div class="metric-label">Network Latency</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.networkConnectivity.status}</div>
        <div class="metric-label">Connection Status</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${this.data.networkConnectivity.localInterfaces.length}</div>
        <div class="metric-label">Local Interfaces</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="generated-at">
      Generated: ${timestamp} | Version: ${this.data.version} | ULTRATHINK EVOLUTION
    </div>
    <p style="margin-top: 16px;">
      🌐 Machines Map V2.0 - The Future of Infrastructure Intelligence<br>
      <small>From reactive monitoring to predictive, autonomous infrastructure management</small>
    </p>
  </div>

</div>

<script>
  // Add some interactivity
  document.addEventListener('DOMContentLoaded', function() {
    // Animate metrics on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('slide-in');
        }
      });
    });

    document.querySelectorAll('.metric-card, .card').forEach(card => {
      observer.observe(card);
    });

    // Add hover effects to cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  });
</script>

</body>
</html>`;
  }

  /**
   * Generate multi-cloud resource card HTML
   */
  private generateMultiCloudCard(resource: any): string {
    const providerColors = {
      'aws': '#FF9900',
      'azure': '#0078D4',
      'gcp': '#4285F4',
      'docker': '#2496ED',
      'local': '#6B7280'
    };

    return `
      <div class="insight-card">
        <div class="flex-center" style="margin-bottom: 16px;">
          <div class="provider-logo" style="background: ${providerColors[resource.provider] || '#6B7280'};"></div>
          <h3 style="margin: 0;">${resource.provider.toUpperCase()} - ${resource.region}</h3>
        </div>

        <div class="grid cols-2" style="margin-bottom: 16px;">
          <div class="metric">
            <div class="metric-value">${resource.resources.length}</div>
            <div class="metric-label">Resources</div>
          </div>
          <div class="metric">
            <div class="metric-value status-${this.getHealthStatusClass(resource.healthScore)}">${resource.healthScore}</div>
            <div class="metric-label">Health Score</div>
          </div>
        </div>

        <div class="table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Status</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${resource.resources.slice(0, 3).map(r => `
              <tr>
                <td><span class="mono">${r.name}</span></td>
                <td><span class="status-badge ${r.status === 'running' ? 'status-success' : 'status-warning'}">${r.status}</span></td>
                <td>$${r.cost.toFixed(4)}/hr</td>
              </tr>
            `).join('')}
          </tbody>
        </div>

        <div class="flex-between" style="margin-top: 12px; font-size: 12px; color: var(--muted);">
          <span>Monthly: $${resource.costAnalysis.monthlyProjection.toFixed(2)}</span>
          <span class="status-badge multi-cloud-badge">${resource.costAnalysis.costTrend}</span>
        </div>
      </div>
    `;
  }

  /**
   * Generate predictive insight card HTML
   */
  private generatePredictiveInsightCard(insight: any): string {
    return `
      <div class="insight-card predictive-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <h3 style="margin: 0; color: var(--predictive);">${insight.insightType.toUpperCase()}</h3>
          <span class="status-badge ${insight.riskLevel === 'critical' ? 'status-danger' : insight.riskLevel === 'high' ? 'status-warning' : 'status-info'}">
            ${insight.riskLevel} RISK
          </span>
        </div>

        <div class="grid cols-3" style="margin-bottom: 16px;">
          <div class="metric">
            <div class="metric-value" style="color: var(--danger);">${insight.failureProbability}%</div>
            <div class="metric-label">Failure Probability</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: var(--predictive);">${insight.confidence}%</div>
            <div class="metric-label">Confidence</div>
          </div>
          <div class="metric">
            <div class="metric-value">${new Date(insight.predictedFailureTime).toLocaleDateString()}</div>
            <div class="metric-label">Predicted Failure</div>
          </div>
        </div>

        <div class="progress-bar" style="margin-bottom: 16px;">
          <div class="progress-fill progress-danger" style="width: ${insight.failureProbability}%"></div>
        </div>

        <div style="font-size: 14px;">
          <strong>Affected Resources:</strong> ${insight.affectedResources.join(', ')}
        </div>

        <div style="margin-top: 12px;">
          <strong>Recommended Actions:</strong>
          <ul style="margin: 8px 0; padding-left: 16px;">
            ${insight.recommendedActions.map(action => `
              <li style="margin-bottom: 4px;">
                ${action.automated ? '🤖' : '👤'} <strong>${action.priority}:</strong> ${action.action}
                <small style="color: var(--muted);"> (${action.estimatedImpact})</small>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Generate remediation card HTML
   */
  private generateRemediationCard(action: any): string {
    return `
      <div class="insight-card remediation-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <h3 style="margin: 0; color: var(--remediation);">${action.actionType.toUpperCase()}</h3>
          <div style="display: flex; gap: 8px;">
            <span class="status-badge ${action.approvalRequired ? 'status-warning' : 'status-success'}">
              ${action.approvalRequired ? 'Approval Required' : 'Automated'}
            </span>
            <span class="status-badge status-info">${action.successProbability}% Success</span>
          </div>
        </div>

        <div class="grid cols-2" style="margin-bottom: 16px;">
          <div class="metric">
            <div class="metric-value">${action.estimatedImpactTime}s</div>
            <div class="metric-label">Impact Time</div>
          </div>
          <div class="metric">
            <div class="metric-value">${action.executionPlan.length}</div>
            <div class="metric-label">Execution Steps</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <strong>Trigger Condition:</strong>
          <div style="background: var(--surface-2); padding: 8px; border-radius: 4px; margin-top: 4px;">
            <code>${action.triggerCondition.metric} ${action.triggerCondition.operator} ${action.triggerCondition.threshold}% for ${action.triggerCondition.duration}s</code>
          </div>
        </div>

        <details style="margin-bottom: 12px;">
          <summary style="cursor: pointer; font-weight: 600;">🔧 Execution Plan</summary>
          <ol style="margin: 8px 0; padding-left: 16px;">
            ${action.executionPlan.map(step => `
              <li style="margin-bottom: 4px; font-size: 13px;">
                <strong>${step.description}</strong>
                <br><small>Expected: ${step.expectedOutcome} (${step.timeout}s timeout)</small>
              </li>
            `).join('')}
          </ol>
        </details>

        ${action.rollbackPlan.length > 0 ? `
          <details>
            <summary style="cursor: pointer; font-weight: 600;">🔄 Rollback Plan</summary>
            <ol style="margin: 8px 0; padding-left: 16px;">
              ${action.rollbackPlan.map(step => `
                <li style="margin-bottom: 4px; font-size: 13px;">
                  ${step.description}
                </li>
              `).join('')}
            </ol>
          </details>
        ` : ''}
      </div>
    `;
  }

  /**
   * Helper methods for status classes
   */
  private getHealthStatusClass(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  private getSecurityStatusClass(score: number): string {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  }

  private getPerformanceStatusClass(score: number): string {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  private getStorageProgressClass(utilization: number): string {
    if (utilization >= 90) return 'progress-danger';
    if (utilization >= 75) return 'progress-warning';
    return 'progress-success';
  }

  private getPerformanceProgressClass(ranking: number): string {
    if (ranking >= 80) return 'progress-success';
    if (ranking >= 60) return 'progress-warning';
    return 'progress-danger';
  }
}

export default MachinesMapV2HTMLGenerator;