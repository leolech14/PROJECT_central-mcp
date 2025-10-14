/**
 * VISUAL MCP CALL EXPERIENCE
 * ===========================
 *
 * ICONIC visual confirmation of agent connection
 * NO RED! ONLY GREEN! IMMEDIATE CERTAINTY!
 */

export function createVisualConnectionExperience(
  agent: string,
  model: string,
  contextWindow: number,
  project: string,
  tasks: any[]
): string {

  const contextDisplay = contextWindow >= 1000000 ? '1M' : `${Math.round(contextWindow/1000)}K`;

  return `

    ██████╗███████╗███╗   ██╗████████╗██████╗  █████╗ ██╗
   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗██║
   ██║     █████╗  ██╔██╗ ██║   ██║   ██████╔╝███████║██║
   ██║     ██╔══╝  ██║╚██╗██║   ██║   ██╔══██╗██╔══██║██║
   ╚██████╗███████╗██║ ╚████║   ██║   ██║  ██║██║  ██║███████╗
    ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝

        ███╗   ███╗ ██████╗██████╗
        ████╗ ████║██╔════╝██╔══██╗
        ██╔████╔██║██║     ██████╔╝
        ██║╚██╔╝██║██║     ██╔═══╝
        ██║ ╚═╝ ██║╚██████╗██║
        ╚═╝     ╚═╝ ╚═════╝╚═╝

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ⚡ CONNECTION ESTABLISHED ⚡                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝


    👤 AGENT IDENTITY
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    NAME:            Agent ${agent}
    MODEL:           ${model}
    CONTEXT:         ${contextDisplay}
    ROLE:            ${getRoleName(agent)}


    🎯 PROJECT ASSIGNMENT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    PROJECT:         ${project}
    YOUR TASKS:      ${tasks.length}


    ✅ STATUS: CONNECTED AND COORDINATED
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ${tasks.length > 0 ? `
    ▶ NEXT: ${tasks[0].id} - ${tasks[0].title}
    ` : `
    ▶ NEXT: Stand by for task assignment
    `}

    Central-MCP is guiding you. Execute with precision. 🎯


╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       🧠 YOU ARE NOW PART OF THE LIVING SYSTEM 🧠        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

`;
}

function getRoleName(agent: string): string {
  const roles: Record<string, string> = {
    'A': 'UI Velocity Specialist',
    'B': 'Design System Specialist',
    'C': 'Backend Services Specialist',
    'D': 'Integration Specialist',
    'E': 'Ground Supervisor',
    'F': 'Strategic Supervisor'
  };
  return roles[agent] || 'General Agent';
}
