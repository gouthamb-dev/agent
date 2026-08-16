"""
SYS_CLI // AGENT - Portfolio Resume Agent

Deployed to Bedrock AgentCore Runtime via `agentcore deploy`.
Streams responses from Bedrock Nova Pro via Strands agent.
"""

from typing import Any
from collections import OrderedDict
from strands import Agent, tool
from strands.agent.conversation_manager.null_conversation_manager import NullConversationManager
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

app = BedrockAgentCoreApp()
log = app.logger


# --- System Prompt ---

import os
from pathlib import Path

# Load system prompt from shared markdown file
_prompt_path = Path(__file__).parent.parent.parent.parent / "system-prompt.md"
if _prompt_path.exists():
    SYSTEM_PROMPT = _prompt_path.read_text(encoding="utf-8")
else:
    SYSTEM_PROMPT = "You are a professional portfolio assistant. Be concise and technical."


# --- Tool Definitions ---


@tool
def get_professional_experience() -> dict:
    """Get structured timeline of professional experience with metrics.
    Returns the complete professional background including roles, companies, and achievements."""

    return {
        "summary": "Staff Software Engineer with extensive experience architecting and delivering large-scale, multi-tenant, microservices-based platforms on AWS. Proven leader in serverless, full-stack solutions, and production-grade Agentic AI for the mortgage technology domain.",
        "yearsOfExperience": 10,
        "timeline": [
            {
                "company": "Dark Matter Technologies",
                "location": "Jacksonville, FL (Hybrid)",
                "role": "Staff Software Engineer",
                "startDate": "2023-10",
                "endDate": "present",
                "highlights": [
                    "Architected distributed microservices and serverless platforms on AWS (Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito, Step Functions) for multi-tenant portal ecosystems",
                    "Built production-grade Agentic AI platforms using Python 3.13, TypeScript, AWS CDK, Docker, Amazon Bedrock, and Bedrock AgentCore",
                    "Implemented RAG workflows with Bedrock Knowledge Bases, Guardrails, Textract, DynamoDB, and S3 for intelligent document processing",
                    "Designed secure AI agent workflows with guardrails, prompt caching, IAM-based access controls, and KMS encryption",
                    "Developed modern React/Vite admin interfaces and managed legacy-to-modern migrations with Vue.js, Angular 14, and Single-SPA microfrontends",
                    "Engineered resilient async workflows using SQS, Step Functions, and DynamoDB Streams",
                    "Helped design multi-tenant active/active AWS environments with 99.99% uptime and disaster recovery readiness",
                    "Led observability with OpenTelemetry, CloudWatch, X-Ray, and Splunk — structured logging and SLO-based alerting",
                ],
            },
            {
                "company": "Black Knight",
                "location": "Jacksonville, FL",
                "role": "Application Programmer IV",
                "startDate": "2021-03",
                "endDate": "2023-10",
                "highlights": [
                    "Developed enterprise-level applications and maintained critical financial systems",
                    "Implemented comprehensive monitoring solutions using advanced analytics platforms",
                ],
            },
            {
                "company": "Eficens Systems",
                "location": "Atlanta Metropolitan Area (Remote)",
                "role": "Java Full Stack Developer",
                "startDate": "2020-01",
                "endDate": "2021-03",
                "highlights": [
                    "Built and maintained microservices for deployment and operations platforms with focus on scalability and performance",
                ],
            },
            {
                "company": "Jacksonville State University",
                "location": "Jacksonville, AL",
                "role": "Graduate Teaching Assistant",
                "startDate": "2018-01",
                "endDate": "2019-12",
                "highlights": [
                    "Assisted in teaching advanced computer science courses",
                    "Mentored undergraduate students and supported academic research in software engineering",
                ],
            },
            {
                "company": "Trendwise Analytics",
                "role": "Full Stack Web Developer",
                "startDate": "2017-05",
                "endDate": "2017-12",
                "highlights": [
                    "Full stack web development",
                ],
            },
            {
                "company": "Sri Technologies Hyderabad",
                "location": "Greater Hyderabad Area (Remote)",
                "role": "Web Application Developer",
                "startDate": "2012-06",
                "endDate": "2015-08",
                "highlights": [
                    "Web application development",
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
            "description": "AI-powered conversational portfolio agent deployed as a framework-agnostic Lit Web Component with terminal-inspired interface",
            "techStack": [
                "TypeScript / Lit 3.x (Web Components)",
                "Vite + Vitest + fast-check",
                "AWS Bedrock (Nova Pro)",
                "Strands Agents SDK (Python)",
                "Bedrock AgentCore Runtime",
                "AWS CDK (Infrastructure)",
            ],
            "architecture": "Framework-agnostic Lit Web Component frontend with Shadow DOM isolation. Backend is a Strands agent on Bedrock AgentCore Runtime streaming responses token-by-token via WebSocket proxy.",
            "keyFeatures": [
                "Real-time streaming from Bedrock to browser",
                "Autonomous tool use with plan-first reasoning",
                "WCAG AA accessible terminal interface",
                "Cross-domain iframe embedding via PostMessage",
                "Zero cold starts (AgentCore managed containers)",
            ],
        },
        "dva": {
            "name": "AI Document Validation Agent (DVA)",
            "description": "AI-powered solution integrated with Borrower Portal workflows for intelligent mortgage document validation and processing",
            "techStack": [
                "Amazon Bedrock",
                "Amazon Textract",
                "Python",
                "AWS Lambda",
                "DynamoDB",
                "S3",
                "Bedrock Guardrails",
            ],
            "architecture": "Event-driven document processing pipeline leveraging Bedrock for intelligent validation, Textract for OCR, and DynamoDB for state management within the Borrower Portal ecosystem.",
            "keyFeatures": [
                "Intelligent mortgage document classification and validation",
                "RAG-powered knowledge retrieval for compliance rules",
                "Bedrock Guardrails for content safety",
                "Integration with Empower LOS workflows",
                "Automated quality checks reducing manual review time",
            ],
        },
        "ai-assistants": {
            "name": "Borrower and Loan Officer AI Assistants",
            "description": "Context-aware AI experiences within the Empower LOS portal with guided question flows and persona-based knowledge-base integration",
            "techStack": [
                "Amazon Bedrock",
                "Bedrock Knowledge Bases",
                "Bedrock Guardrails",
                "React",
                "TypeScript",
                "DynamoDB",
                "Lambda",
            ],
            "architecture": "Multi-persona AI assistant platform with context-aware routing, dynamic chips UI, and strict guardrails. Knowledge bases scoped per persona for borrower vs loan officer workflows.",
            "keyFeatures": [
                "Context-aware guided question flows",
                "Dynamic chips and follow-up suggestions",
                "Persona-based knowledge-base integration",
                "Strict AI guardrails and content filtering",
                "Loan-status retrieval and contextual workflows",
            ],
        },
        "portal-modernization": {
            "name": "Enterprise Portal Modernization",
            "description": "Multi-tenant portal engineering across React, Vue, and Angular with microfrontends, dynamic theming, and reusable UI components",
            "techStack": [
                "React",
                "Vue.js 2/3",
                "Angular 14",
                "TypeScript",
                "Single-SPA (Microfrontends)",
                "Tailwind CSS",
                "AWS CloudFront",
                "S3",
            ],
            "architecture": "Microfrontend architecture using Single-SPA shell with independently deployable React, Vue, and Angular applications. Multi-tenant theming engine with dynamic CSS injection.",
            "keyFeatures": [
                "Microfrontend composition via Single-SPA",
                "Dynamic theming and branding per tenant",
                "Accessibility-first component library",
                "Legacy Angular to modern React migration path",
                "Multi-tenant portal isolation",
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
        "ai_and_llm": [
            "Amazon Bedrock",
            "Bedrock AgentCore",
            "Bedrock Guardrails",
            "Knowledge Bases",
            "RAG",
            "Claude Sonnet 4",
            "Claude Haiku 4.5",
            "Amazon Textract",
            "Prompt Caching",
            "LLM Orchestration",
            "Strands Agents SDK",
        ],
        "aws_cloud": [
            "Lambda",
            "API Gateway (REST/WebSocket)",
            "DynamoDB",
            "S3",
            "CloudFront",
            "Cognito",
            "Step Functions",
            "SQS",
            "ECR",
            "KMS",
            "VPC",
            "CloudWatch",
            "X-Ray",
            "WAF",
            "IAM",
            "Route53",
        ],
        "backend_and_languages": [
            "Python 3.13",
            "TypeScript",
            "JavaScript",
            "Java",
            "Node.js",
            "C#",
            ".NET",
            "SQL",
            "boto3",
            "Pydantic",
        ],
        "frontend": [
            "React",
            "Vite",
            "Angular 14",
            "Vue.js 2/3",
            "Tailwind CSS",
            "Framer Motion",
            "TanStack Query/Table",
            "RxJS",
            "Webpack",
            "Single-SPA (Microfrontends)",
            "Lit / Web Components",
        ],
        "infrastructure_and_devops": [
            "AWS CDK",
            "Terraform",
            "Docker",
            "Azure DevOps Pipelines",
            "AWS CodePipeline/CodeBuild",
            "CI/CD Automation",
        ],
        "observability_and_security": [
            "OpenTelemetry",
            "Splunk",
            "OAuth",
            "JWT/JWE",
            "Custom Authorizers",
            "Security Architecture",
        ],
        "testing_and_quality": [
            "Jest",
            "pytest",
            "Cypress",
            "ESLint",
            "Prettier",
            "Mocha",
            "Chai",
            "TDD/BDD",
            "Regression Validation",
        ],
        "certifications": [
            "AWS Agentic AI Demonstrated (Apr 2026)",
            "AWS Application Networking Demonstrated (Apr 2026)",
            "AWS Incident Response Demonstrated (Apr 2026)",
            "AWS Serverless Demonstrated (Dec 2025)",
            "AWS Certified Machine Learning Engineer – Associate (Feb 2025)",
            "AWS Certified AI Practitioner (Jan 2025)",
            "AWS Certified Data Engineer – Associate (Jan 2025)",
            "AWS Certified SysOps Administrator – Associate (Jan 2025)",
            "AWS Certified Developer – Associate (Jan 2025)",
            "AWS Certified Solutions Architect – Associate (Jan 2025)",
            "AWS Certified Cloud Practitioner (May 2022)",
        ],
    }


# --- Tools list ---
tools = [get_professional_experience, get_project_architecture, get_skills]


# --- Agent Factory (session-aware, LRU cache) ---

def agent_factory():
    cache = OrderedDict()

    def get_or_create_agent(session_id):
        if session_id in cache:
            cache.move_to_end(session_id)
            return cache[session_id]
        if len(cache) >= 128:
            cache.popitem(last=False)
        cache[session_id] = Agent(
            model=load_model(),
            system_prompt=SYSTEM_PROMPT,
            tools=tools,
            conversation_manager=NullConversationManager(),
        )
        return cache[session_id]

    return get_or_create_agent


get_or_create_agent = agent_factory()


# --- AgentCore Entrypoint ---


@app.entrypoint
async def invoke(payload, context):
    """AgentCore entrypoint — streams the agent response."""
    log.info("Invoking SYS_CLI // AGENT")

    session_id = getattr(context, "session_id", "default-session")
    agent = get_or_create_agent(session_id)

    # Accept either {"prompt": "..."} or {"messages": [...]}
    if "messages" in payload:
        prompt = payload["messages"]
    else:
        prompt = payload.get("prompt", "No prompt provided.")

    async for event in agent.stream_async(prompt):
        if not isinstance(event, dict) or "event" not in event:
            continue
        cbs = event["event"].get("contentBlockStart")
        if cbs is not None and not cbs.get("start"):
            continue
        yield event


if __name__ == "__main__":
    app.run()
