"""
SYS_CLI // AGENT - Tool Definitions

Edit the return values below with YOUR actual resume data.
These tools are invoked by the Strands agent during reasoning.
"""

from strands import tool


@tool
def get_professional_experience() -> dict:
    """Get structured timeline of professional experience with metrics.
    Returns the complete professional background including roles, companies, and achievements."""

    return {
        "summary": "Full-stack software engineer with 5+ years of experience building scalable web applications and cloud-native services.",
        "yearsOfExperience": 5,
        "timeline": [
            {
                "company": "Acme Corp",
                "role": "Senior Software Engineer",
                "startDate": "2022-01",
                "endDate": "present",
                "highlights": [
                    "Led migration of monolithic application to microservices architecture, reducing deployment time by 70%",
                    "Designed and implemented real-time data pipeline processing 2M+ events/day using AWS Kinesis",
                    "Mentored team of 4 junior engineers, establishing code review practices and CI/CD standards",
                ],
            },
            {
                "company": "StartupXYZ",
                "role": "Software Engineer",
                "startDate": "2020-06",
                "endDate": "2021-12",
                "highlights": [
                    "Built customer-facing dashboard serving 50K+ daily active users with React and TypeScript",
                    "Implemented serverless API layer with AWS Lambda and API Gateway, cutting infrastructure costs by 40%",
                    "Designed event-driven architecture using SNS/SQS for async processing workflows",
                ],
            },
            {
                "company": "TechCo",
                "role": "Junior Developer",
                "startDate": "2019-01",
                "endDate": "2020-05",
                "highlights": [
                    "Developed RESTful APIs in Python/FastAPI serving mobile and web clients",
                    "Contributed to open-source internal tooling adopted by 3 engineering teams",
                    "Automated deployment pipelines with GitHub Actions, reducing release cycles from weekly to daily",
                ],
            },
        ],
    }


@tool
def get_project_architecture(project_name: str) -> dict:
    """Get blueprint data and tech stack specifications for a named project.

    Args:
        project_name: Name of the project to look up architecture for.
    """

    projects = {
        "sys-cli-agent": {
            "name": "SYS_CLI // AGENT",
            "description": "AI-powered conversational agent Web Component with terminal-inspired interface",
            "techStack": [
                "TypeScript / Lit 3.x (Web Components)",
                "Vite + Vitest + fast-check",
                "AWS Bedrock (Nova Pro)",
                "Strands Agents SDK (Python)",
                "Bedrock AgentCore Runtime",
            ],
            "architecture": "Framework-agnostic Lit Web Component frontend with Shadow DOM isolation. Backend is a Strands agent on Bedrock AgentCore Runtime streaming responses token-by-token via SSE.",
            "keyFeatures": [
                "Real-time streaming from Bedrock to browser",
                "Autonomous tool use with plan-first reasoning",
                "WCAG AA accessible terminal interface",
                "Cross-domain iframe embedding via PostMessage",
                "Zero cold starts (AgentCore managed containers)",
            ],
        },
        "data-pipeline": {
            "name": "Real-Time Data Pipeline",
            "description": "Event-driven data processing system handling 2M+ events/day",
            "techStack": ["Python", "AWS Kinesis", "Lambda", "DynamoDB", "S3", "CloudWatch"],
            "architecture": "Fan-out pattern with Kinesis Data Streams feeding multiple Lambda consumers.",
            "keyFeatures": [
                "Sub-second event processing latency",
                "Automatic scaling with enhanced fan-out",
                "Dead letter queue with retry logic",
            ],
        },
    }

    project = projects.get(project_name.lower().replace(" ", "-"))
    if project:
        return {"found": True, **project}
    return {
        "found": False,
        "message": f"Project '{project_name}' not found. Available: {', '.join(projects.keys())}",
    }


@tool
def get_skills() -> dict:
    """Get technical skills organized by category."""

    return {
        "languages": ["TypeScript", "Python", "JavaScript", "Go", "SQL"],
        "frontend": ["React", "Lit / Web Components", "Next.js", "Tailwind CSS"],
        "backend": ["FastAPI", "Node.js", "Express", "GraphQL"],
        "cloud": [
            "AWS (Bedrock, AgentCore, Lambda, API Gateway, DynamoDB, S3, Kinesis)",
            "Infrastructure as Code (CDK, SAM)",
            "CI/CD (GitHub Actions, CodePipeline)",
        ],
        "ai_ml": ["Strands Agents SDK", "Bedrock", "RAG", "Vector Search"],
        "data": ["PostgreSQL", "DynamoDB", "Redis", "Elasticsearch"],
        "practices": [
            "Microservices Architecture",
            "Event-Driven Design",
            "Property-Based Testing",
            "TDD / BDD",
        ],
    }
