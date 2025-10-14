#!/usr/bin/env python3
"""
🎨 REGISTRY HTML REPORT GENERATOR
==================================
Creates beautiful, human-friendly HTML dashboards from registry YAML
"""

import yaml
import json
from datetime import datetime
from pathlib import Path

def generate_html_report(yaml_path: str, output_path: str = "registry_report.html"):
    """Generate beautiful HTML report from registry YAML"""

    # Load YAML data
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)

    project_name = data.get('project', 'Unknown Project')
    backend_connections = data.get('backend_connections', [])
    external_apis = data.get('external_apis', [])
    readiness = data.get('commercial_readiness', {})

    # Calculate stats
    total_connections = len(backend_connections) + len(external_apis)
    readiness_score = readiness.get('overall_score', 0)
    readiness_max = readiness.get('max_score', 1)
    readiness_pct = readiness.get('completion_percentage', 0)
    blocking_layers = readiness.get('blocking_layers', [])

    # Count by category
    backend_by_category = {}
    for conn in backend_connections:
        cat = conn.get('category', 'unknown')
        backend_by_category[cat] = backend_by_category.get(cat, 0) + 1

    api_by_category = {}
    for api in external_apis:
        cat = api.get('category', 'unknown')
        api_by_category[cat] = api_by_category.get(cat, 0) + 1

    # Generate HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔗 Registry Report - {project_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #333;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .header {{
            background: white;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }}

        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}

        .header .subtitle {{
            color: #666;
            font-size: 1.1rem;
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}

        .stat-card {{
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }}

        .stat-card:hover {{
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }}

        .stat-card .icon {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }}

        .stat-card .value {{
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }}

        .stat-card .label {{
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .section {{
            background: white;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }}

        .section-header {{
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid #f0f0f0;
        }}

        .section-header .icon {{
            font-size: 2rem;
        }}

        .section-header h2 {{
            font-size: 1.8rem;
            color: #333;
        }}

        .connection-grid {{
            display: grid;
            gap: 1rem;
        }}

        .connection-card {{
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s;
        }}

        .connection-card:hover {{
            transform: translateX(4px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }}

        .connection-card.backend {{
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }}

        .connection-card.api {{
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }}

        .connection-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }}

        .connection-name {{
            font-size: 1.3rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}

        .badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .badge.database {{ background: #e3f2fd; color: #1976d2; }}
        .badge.cache {{ background: #f3e5f5; color: #7b1fa2; }}
        .badge.storage {{ background: #e8f5e9; color: #388e3c; }}
        .badge.llm {{ background: #fff3e0; color: #f57c00; }}
        .badge.payments {{ background: #e0f2f1; color: #00796b; }}
        .badge.email {{ background: #fce4ec; color: #c2185b; }}

        .connection-details {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }}

        .detail {{
            background: white;
            padding: 0.75rem;
            border-radius: 8px;
        }}

        .detail-label {{
            font-size: 0.75rem;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }}

        .detail-value {{
            font-weight: 600;
            color: #333;
        }}

        .files-list {{
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 2px dashed rgba(0,0,0,0.1);
        }}

        .files-label {{
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }}

        .files-items {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }}

        .file-tag {{
            background: white;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-family: 'Courier New', monospace;
            border: 1px solid rgba(0,0,0,0.1);
        }}

        .readiness-section {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}

        .readiness-score {{
            text-align: center;
            padding: 2rem;
            margin-bottom: 2rem;
        }}

        .readiness-score .big-number {{
            font-size: 5rem;
            font-weight: bold;
            line-height: 1;
        }}

        .readiness-score .fraction {{
            font-size: 1.5rem;
            opacity: 0.9;
            margin-top: 0.5rem;
        }}

        .readiness-score .label {{
            font-size: 1.2rem;
            opacity: 0.9;
            margin-top: 1rem;
        }}

        .progress-bar {{
            width: 100%;
            height: 40px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            overflow: hidden;
            margin-top: 1rem;
        }}

        .progress-fill {{
            height: 100%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #667eea;
            transition: width 1s ease;
        }}

        .categories-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }}

        .category-card {{
            background: white;
            color: #333;
            border-radius: 12px;
            padding: 1.5rem;
        }}

        .category-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }}

        .category-name {{
            font-size: 1.2rem;
            font-weight: bold;
        }}

        .category-score {{
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }}

        .category-items {{
            display: grid;
            gap: 0.5rem;
        }}

        .item-row {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: #f5f5f5;
            border-radius: 6px;
        }}

        .item-row.complete {{
            background: #e8f5e9;
        }}

        .item-row.incomplete {{
            background: #ffebee;
        }}

        .check {{
            font-size: 1.2rem;
        }}

        .blockers-section {{
            background: #ff5252;
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-top: 2rem;
        }}

        .blockers-header {{
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}

        .blocker-list {{
            display: grid;
            gap: 0.75rem;
        }}

        .blocker-item {{
            background: rgba(255,255,255,0.2);
            padding: 1rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-family: 'Courier New', monospace;
        }}

        .cost-card {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin-top: 1rem;
        }}

        .cost-header {{
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }}

        .cost-details {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }}

        .cost-item {{
            background: rgba(255,255,255,0.2);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }}

        .cost-value {{
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }}

        .cost-label {{
            font-size: 0.9rem;
            opacity: 0.9;
        }}

        .footer {{
            text-align: center;
            color: white;
            margin-top: 3rem;
            opacity: 0.8;
        }}

        @media (max-width: 768px) {{
            .header h1 {{
                font-size: 2rem;
            }}
            .stats-grid {{
                grid-template-columns: 1fr;
            }}
            .categories-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔗 Connection Registry Report</h1>
            <div class="subtitle">
                <strong>{project_name}</strong> • Generated {datetime.now().strftime('%B %d, %Y at %H:%M')}
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="icon">🔗</div>
                <div class="value">{total_connections}</div>
                <div class="label">Total Connections</div>
            </div>
            <div class="stat-card">
                <div class="icon">🔧</div>
                <div class="value">{len(backend_connections)}</div>
                <div class="label">Backend Services</div>
            </div>
            <div class="stat-card">
                <div class="icon">🌐</div>
                <div class="value">{len(external_apis)}</div>
                <div class="label">External APIs</div>
            </div>
            <div class="stat-card">
                <div class="icon">🎯</div>
                <div class="value">{readiness_pct:.0f}%</div>
                <div class="label">Commercial Ready</div>
            </div>
        </div>
"""

    # Backend Connections Section
    html += f"""
        <!-- Backend Connections -->
        <div class="section">
            <div class="section-header">
                <span class="icon">🔧</span>
                <h2>Backend Connections ({len(backend_connections)})</h2>
            </div>
            <div class="connection-grid">
"""

    for conn in backend_connections:
        conn_id = conn.get('id', 'unknown')
        category = conn.get('category', 'unknown')
        provider = conn.get('provider', 'unknown')
        files = conn.get('discovered_in_files', [])
        file_count = len(files)

        html += f"""
                <div class="connection-card backend">
                    <div class="connection-header">
                        <div class="connection-name">
                            {get_icon(category)} {conn_id}
                        </div>
                        <span class="badge {category}">{category}</span>
                    </div>
                    <div class="connection-details">
                        <div class="detail">
                            <div class="detail-label">Provider</div>
                            <div class="detail-value">{provider}</div>
                        </div>
                        <div class="detail">
                            <div class="detail-label">Files Using</div>
                            <div class="detail-value">{file_count} files</div>
                        </div>
                    </div>
"""

        if files[:5]:  # Show first 5 files
            html += f"""
                    <div class="files-list">
                        <div class="files-label">📁 Used in:</div>
                        <div class="files-items">
"""
            for file in files[:5]:
                filename = Path(file).name
                html += f'                            <div class="file-tag">{filename}</div>\n'

            if len(files) > 5:
                html += f'                            <div class="file-tag">+{len(files) - 5} more...</div>\n'

            html += """
                        </div>
                    </div>
"""

        html += """
                </div>
"""

    html += """
            </div>
        </div>
"""

    # External APIs Section
    html += f"""
        <!-- External APIs -->
        <div class="section">
            <div class="section-header">
                <span class="icon">🌐</span>
                <h2>External API Integrations ({len(external_apis)})</h2>
            </div>
            <div class="connection-grid">
"""

    for api in external_apis:
        api_id = api.get('id', 'unknown')
        category = api.get('category', 'unknown')
        provider = api.get('provider', 'unknown')
        files = api.get('discovered_in_files', [])
        file_count = len(files)
        compliance = api.get('compliance', [])
        cost = api.get('cost')

        html += f"""
                <div class="connection-card api">
                    <div class="connection-header">
                        <div class="connection-name">
                            {get_icon(category)} {api_id}
                        </div>
                        <span class="badge {category}">{category}</span>
                    </div>
                    <div class="connection-details">
                        <div class="detail">
                            <div class="detail-label">Provider</div>
                            <div class="detail-value">{provider}</div>
                        </div>
                        <div class="detail">
                            <div class="detail-label">Files Using</div>
                            <div class="detail-value">{file_count} files</div>
                        </div>
"""

        if compliance:
            html += f"""
                        <div class="detail">
                            <div class="detail-label">Compliance</div>
                            <div class="detail-value">{', '.join(compliance)}</div>
                        </div>
"""

        html += """
                    </div>
"""

        # Cost tracking for LLM providers
        if cost and category == 'llm':
            budget = cost.get('budget_monthly', 0)
            spent = cost.get('current_spend')
            projected = cost.get('projected_monthly')

            if budget:
                html += f"""
                    <div class="cost-card">
                        <div class="cost-header">💰 Cost Tracking</div>
                        <div class="cost-details">
                            <div class="cost-item">
                                <div class="cost-value">${budget:,.0f}</div>
                                <div class="cost-label">Monthly Budget</div>
                            </div>
"""
                if spent is not None:
                    html += f"""
                            <div class="cost-item">
                                <div class="cost-value">${spent:,.2f}</div>
                                <div class="cost-label">Current Spend</div>
                            </div>
"""
                if projected:
                    html += f"""
                            <div class="cost-item">
                                <div class="cost-value">${projected:,.2f}</div>
                                <div class="cost-label">Projected</div>
                            </div>
"""
                html += """
                        </div>
                    </div>
"""

        if files[:5]:
            html += f"""
                    <div class="files-list">
                        <div class="files-label">📁 Used in:</div>
                        <div class="files-items">
"""
            for file in files[:5]:
                filename = Path(file).name
                html += f'                            <div class="file-tag">{filename}</div>\n'

            if len(files) > 5:
                html += f'                            <div class="file-tag">+{len(files) - 5} more...</div>\n'

            html += """
                        </div>
                    </div>
"""

        html += """
                </div>
"""

    html += """
            </div>
        </div>
"""

    # Commercial Readiness Section
    html += f"""
        <!-- Commercial Readiness -->
        <div class="section readiness-section">
            <div class="section-header">
                <span class="icon">🎯</span>
                <h2>Commercial Readiness Score</h2>
            </div>

            <div class="readiness-score">
                <div class="big-number">{readiness_pct:.0f}%</div>
                <div class="fraction">{readiness_score} / {readiness_max} points</div>
                <div class="label">Production Ready</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {readiness_pct}%">
                        {readiness_pct:.0f}%
                    </div>
                </div>
            </div>

            <div class="categories-grid">
"""

    # Categories
    for cat_key in ['identity', 'payments', 'email', 'security']:
        cat = readiness.get(cat_key)
        if cat:
            name = cat.get('name', cat_key.title())
            score = cat.get('score', 0)
            max_score = cat.get('max_score', 1)
            items = cat.get('items', {})

            html += f"""
                <div class="category-card">
                    <div class="category-header">
                        <div class="category-name">{name}</div>
                        <div class="category-score">{score}/{max_score}</div>
                    </div>
                    <div class="category-items">
"""

            for item_name, complete in items.items():
                check = '✅' if complete else '❌'
                status_class = 'complete' if complete else 'incomplete'
                html += f"""
                        <div class="item-row {status_class}">
                            <span class="check">{check}</span>
                            <span>{item_name.replace('_', ' ').title()}</span>
                        </div>
"""

            html += """
                    </div>
                </div>
"""

    html += """
            </div>
"""

    # Blocking Layers
    if blocking_layers:
        html += f"""
            <div class="blockers-section">
                <div class="blockers-header">
                    🚨 Blocking Layers ({len(blocking_layers)})
                </div>
                <div class="blocker-list">
"""
        for blocker in blocking_layers:
            html += f"""
                    <div class="blocker-item">❌ {blocker}</div>
"""
        html += """
                </div>
            </div>
"""

    html += """
        </div>
"""

    # Footer
    html += f"""
        <div class="footer">
            Generated by Registry Discovery Engine • {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        </div>
    </div>
</body>
</html>
"""

    # Write HTML file
    with open(output_path, 'w') as f:
        f.write(html)

    print(f"✅ HTML report generated: {output_path}")
    return output_path

def get_icon(category):
    """Get emoji icon for category"""
    icons = {
        'database': '🗄️',
        'cache': '⚡',
        'storage': '📦',
        'queue': '📬',
        'auth': '🔐',
        'search': '🔍',
        'llm': '🤖',
        'payments': '💳',
        'email': '📧',
        'analytics': '📊',
        'identity': '👤',
        'media': '🎨',
    }
    return icons.get(category, '🔗')

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python generate_html_report.py connections_registry.yaml [output.html]")
        sys.exit(1)

    yaml_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "registry_report.html"

    generate_html_report(yaml_path, output_path)
    print(f"\n🎉 Open in browser: file://{Path(output_path).absolute()}")
