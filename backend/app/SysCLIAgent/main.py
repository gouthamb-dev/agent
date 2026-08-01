"""
SYS_CLI // AGENT - Bedrock AgentCore Runtime Entry Point

Deployed to AgentCore Runtime via `agentcore deploy`.
Streams responses directly from Bedrock Nova Pro via Strands agent.
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models.bedrock import BedrockModel
from tools import get_professional_experience, get_project_architecture, get_skills


# --- System Prompt ---

SYSTEM_PROMPT = """You are SYS_CLI // AGENT — a professional portfolio assistant deployed as a terminal-style Web Component.

Your purpose is to help visitors learn about the developer's professional background, technical skills, and project work. You have access to tools that provide structured data about:
- Professional experience (timeline, roles, achievements)
- Project architectures (tech stacks, design decisions)
- Technical skills (languages, frameworks, cloud services)

Behavior guidelines:
- Always plan before invoking tools. State what you're going to look up.
- Be concise and technical — this is a terminal interface, not a chatbot.
- Format responses for readability: use bullet points for lists, keep paragraphs short.
- When asked about specific projects, use get_project_architecture.
- When asked about experience/background, use get_professional_experience.
- When asked about skills/tech stack, use get_skills.
- If the question is unrelated to the portfolio, politely redirect.
"""


# --- Agent Factory ---

def create_agent() -> Agent:
    """Create a Strands agent with Bedrock Nova Pro."""
    model = BedrockModel(
        model_id="us.amazon.nova-pro-v1:0",
        region_name="us-east-1",
    )
    return Agent(
        model=model,
        tools=[get_professional_experience, get_project_architecture, get_skills],
        system_prompt=SYSTEM_PROMPT,
    )


# --- AgentCore Runtime ---

app = BedrockAgentCoreApp()
agent = create_agent()


@app.entrypoint
async def invoke(payload):
    """
    AgentCore entrypoint — streams the agent response.

    Receives: {"prompt": "user question"}
    Yields: streaming events as the agent reasons + generates tokens
    """
    user_message = payload.get(
        "prompt",
        "No prompt provided. Send a JSON payload with a 'prompt' key."
    )

    # Stream response — AgentCore handles transport to the caller
    async for event in agent.stream_async(user_message):
        yield event


if __name__ == "__main__":
    app.run()
