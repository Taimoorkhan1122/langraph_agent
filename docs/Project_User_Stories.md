PROJECT REQUIREMENTS

**LangGraph Hierarchical Agent System**

with Weaviate Vector Database & Multi-Tenancy

User Stories & Technical Specifications

Agile Development Documentation

Version 1.0

LangGraph Hierarchical Agent System - User Stories

# **Table of Contents**

Table of Contents

Table of Contents 2

Executive Summary 2

Project Overview 2

Epic Breakdown 3

EPIC-001: Vector Database Infrastructure 3

> US-001: Setup Weaviate Docker Container 3
>
> US-002: Create Multi-Tenancy Schema 4
>
> US-003: Insert Sample Data Entries 5

EPIC-002: Delegating Agent 5

> US-004: Implement Query Classification Logic 5
>
> US-005: Implement LangGraph Agent Hierarchy 6

EPIC-003: RAG Agent 6

> US-006: Implement Vector Database Query 7
>
> US-007: Generate Answer with References 7

EPIC-004: Chart.js Tool 8

> US-008: Implement Mock Chart Generation 8

EPIC-005: Integration & Response Streaming 8

> US-009: Implement Parallel Tool Execution 9
>
> US-010: Implement Streaming Response Format 9

Technical Architecture 10

Dependencies & Task Sequencing 10

Sprint Planning Recommendations 11

Appendix: Technical Reference 12

Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select "Update Field."

# **Executive Summary**

This document outlines the comprehensive user stories and technical specifications for building a LangGraph Hierarchical Agent System integrated with Weaviate Vector Database. The system is designed to provide intelligent query routing, retrieval-augmented generation (RAG) capabilities, and dynamic chart generation through a sophisticated agent hierarchy. The architecture follows modern AI development patterns, leveraging LangGraph for agent orchestration, LangChain for LLM abstraction, and Weaviate for efficient vector storage with multi-tenancy support.

The project is structured into two primary components: Part 1 focuses on establishing a robust vector database infrastructure with multi-tenancy capabilities, enabling isolated data storage per tenant while maintaining efficient semantic search functionality. Part 2 implements the hierarchical agent system that intelligently routes user queries to appropriate tools, coordinates between multiple agents, and provides comprehensive responses with full data provenance tracking.

The solution architecture emphasizes scalability, maintainability, and extensibility, following Agile development principles with clear acceptance criteria for each user story. Developers can use this document as a comprehensive guide for implementation, ensuring alignment with stakeholder requirements and industry best practices for AI-powered application development.

# **Project Overview**

## **Technology Stack**

The technology stack has been carefully selected to provide a robust foundation for building AI-powered applications with modern development practices. Each component serves a specific purpose in the overall architecture, ensuring seamless integration and optimal performance throughout the system.

|       **Component**       |                     **Description & Purpose**                     |
| :-----------------------: | :---------------------------------------------------------------: |
|          Node.js          |         Primary runtime environment for the entire system         |
|          Docker           |           Containerization for Weaviate vector database           |
|    Weaviate JS Client     |     Official client for Weaviate vector database interactions     |
|         LangGraph         | Framework for building agent hierarchy and workflow orchestration |
|         LangChain         |     LLM communication abstraction and tool integration layer      |
| Google Gemini / Local LLM |       Language model for reasoning and response generation        |

_Table 1: Technology Stack Components_

# **Epic Breakdown**

The project has been organized into distinct epics that represent major functional areas of the system. Each epic encompasses multiple user stories that contribute to the overall functionality. This hierarchical organization enables better sprint planning, clear progress tracking, and efficient resource allocation throughout the development lifecycle.

| **Epic ID** |         **Epic Name**          |                            **Description**                            |
| :---------: | :----------------------------: | :-------------------------------------------------------------------: |
|  EPIC-001   | Vector Database Infrastructure | Setup Weaviate with Docker, schema design, and multi-tenancy support  |
|  EPIC-002   |        Delegating Agent        |     Implement intelligent query routing and decision-making logic     |
|  EPIC-003   |           RAG Agent            | Build retrieval-augmented generation with vector database integration |
|  EPIC-004   |         Chart.js Tool          |    Implement chart generation tool with mock configuration output     |
|  EPIC-005   |     Integration & Response     |    Orchestrate multi-tool execution and streaming response format     |

_Table 2: Project Epic Breakdown_

# **EPIC-001: Vector Database Infrastructure**

This epic focuses on establishing the foundational data layer for the system. The Weaviate vector database provides semantic search capabilities through vector embeddings, enabling efficient retrieval of relevant information based on conceptual similarity rather than exact keyword matching. The multi-tenancy architecture ensures data isolation between different organizational units or clients, making the system suitable for enterprise deployments where data segregation is a critical requirement.

## **US-001: Setup Weaviate Docker Container**

As a **DevOps Engineer**, I want to **run Weaviate in a Docker container** so that the vector database is isolated, portable, and easy to deploy across environments.

This user story establishes the containerized infrastructure foundation for the vector database. Docker containerization provides consistent deployment across development, testing, and production environments, eliminating the common issues associated with environment-specific configurations. The containerization approach also facilitates horizontal scaling and enables seamless integration with container orchestration platforms like Kubernetes for enterprise deployments.

### **Acceptance Criteria**

1. A Docker Compose file (docker-compose.yml) is created with Weaviate service configuration that specifies the appropriate image version, ports, and environment variables required for proper operation.
1. Weaviate container starts successfully using 'docker-compose up' command without errors, and the container remains in a healthy running state.
1. Weaviate is accessible at localhost:8080 with the REST API responding to health check endpoints, returning a valid HTTP 200 status code.
1. Docker volumes are properly configured for data persistence, ensuring that data survives container restarts and recreations.
1. Environment variables for authentication and module configuration are properly set and documented in a README file.

## **US-002: Create Multi-Tenancy Schema**

As a **Backend Developer**, I want to **define a multi-tenant schema with specific fields** so that each tenant's data is isolated while maintaining a consistent data structure for document Q&A retrieval.

The schema design is crucial for the overall system functionality as it defines how data is structured, indexed, and retrieved. Multi-tenancy ensures that each client or organizational unit operates within their own isolated data space, preventing data leakage between tenants while allowing the system to serve multiple clients efficiently from a shared infrastructure.

### **Schema Field Specifications**

| **Field Name** | **Data Type** | **Indexing** |             **Description**             |
| :------------: | :-----------: | :----------: | :-------------------------------------: |
|     fileId     |    string     |      No      | Unique identifier for each source file  |
|    question    |     text      |     Yes      |  The question being asked (vectorized)  |
|     answer     |     text      |     Yes      | The answer to the question (vectorized) |
|   pageNumber   |    text[]     |      No      |  Page numbers where answer was derived  |

_Table 3: Schema Field Specifications for Document Collection_

### **Acceptance Criteria**

1. A Weaviate collection class named 'Document' is created with multi-tenancy enabled (multiTenancyConfig: { enabled: true }).
1. The schema includes all four required fields (fileId, question, answer, pageNumber) with correct data types and indexing configurations as specified in the requirements.
1. The 'fileId' field is configured with skip vectorization and skip index search to prevent unnecessary indexing overhead.
1. Schema creation can be verified through Weaviate's schema endpoint (GET /v1/schema) returning the complete schema definition.
1. The schema is created programmatically using the Weaviate JavaScript client with proper error handling and validation.

## **US-003: Insert Sample Data Entries**

As a **Backend Developer**, I want to **insert fictional document entries into the vector database** so that the RAG agent has test data to retrieve and demonstrate retrieval capabilities.

Populating the database with sample data is essential for testing and demonstrating the system's retrieval capabilities. The sample entries should represent realistic document question-answer pairs that showcase the vector similarity search functionality. Since Weaviate automatically generates vectors for text fields, developers do not need to manually provide embeddings, simplifying the data insertion process.

### **Sample Data Examples**

The following sample entries demonstrate the expected data format and content. Each entry includes a question, its corresponding answer, the source file identifier, and the page numbers where the information was originally located.

- Entry 1: fileId='doc-001', question='What is the company refund policy?', answer='Our company offers a 30-day money-back guarantee on all products...', pageNumber=['5', '6']
- Entry 2: fileId='doc-002', question='How do I reset my password?', answer='To reset your password, click on the "Forgot Password" link...', pageNumber=['12']
- Entry 3: fileId='doc-003', question='What are the API rate limits?', answer='The API allows 1000 requests per minute per tenant...', pageNumber=['3', '4', '8']

### **Acceptance Criteria**

1. A tenant is created using the Weaviate JavaScript client with a unique tenant identifier before inserting data.
1. At least three fictional document entries are inserted into the vector database under the created tenant.
1. Each entry contains all required fields: fileId, question, answer, and pageNumber array.
1. Vectors are automatically generated by Weaviate for the question and answer text fields without manual embedding provision.
1. Data insertion is verified by querying the database and confirming all entries are retrievable.

# **EPIC-002: Delegating Agent**

The Delegating Agent serves as the orchestration layer of the system, acting as an intelligent router that determines how to best serve user queries. This agent analyzes incoming requests and makes decisions about which tools or sub-agents to invoke, enabling complex workflows that may involve multiple tools operating in parallel or sequentially. The delegating agent is the primary interface for users and is responsible for aggregating responses into a cohesive output format.

## **US-004: Implement Query Classification Logic**

As an **AI Engineer**, I want the **Delegating Agent to classify user queries** so that the system can route requests to the appropriate tool (Chart.js, RAG Agent, or direct response).

Query classification is the foundation of intelligent routing. The agent must analyze the user's intent by examining keywords, semantic meaning, and context to determine whether the query requires chart generation, information retrieval, or can be answered directly. This classification enables efficient resource utilization and appropriate response generation.

### **Classification Categories**

- Chart Request: Queries containing keywords like 'chart', 'graph', 'plot', 'visualize', or requesting data representation in visual format should be routed to the Chart.js tool.
- Information Retrieval: Questions seeking factual information, document content, or knowledge base lookups should be routed to the RAG Agent for database querying.
- Direct Response: General conversational queries, greetings, or questions that don't require specialized tools should be answered directly by the agent.
- Hybrid Request: Complex queries requiring both visualization and data retrieval should trigger both tools in parallel or sequentially.

### **Acceptance Criteria**

1. The Delegating Agent is implemented using LangGraph with a defined state graph that includes classification nodes and conditional edges.
1. The agent correctly identifies chart requests (e.g., 'Show me a bar chart of sales') and routes to the Chart.js tool with appropriate parameters extracted from the query.
1. The agent correctly identifies information retrieval queries (e.g., 'What is the refund policy?') and routes to the RAG Agent with the query text.
1. The agent can handle hybrid queries by invoking both Chart.js and RAG Agent in parallel when the query requires both visualization and data.
1. Classification logic is implemented using LangChain's LLM integration with appropriate prompting for intent recognition.

## **US-005: Implement LangGraph Agent Hierarchy**

As an **AI Engineer**, I want to **structure the agent system as a hierarchy using LangGraph** so that there is a clear separation of concerns between the delegating agent, tools, and sub-agents.

The hierarchical structure enables modular development and testing of individual components. LangGraph provides the framework for defining agent workflows as state machines, where each node represents a processing step and edges define the flow of information between components. This architecture supports complex multi-step reasoning while maintaining code clarity and testability.

### **Agent Hierarchy Architecture**

The hierarchical architecture follows a top-down design pattern where the Delegating Agent serves as the entry point, coordinating between specialized tools and sub-agents. This structure enables independent development and testing of each component while maintaining clear interfaces for communication.

- Level 0 - Delegating Agent: Entry point that receives all user queries and orchestrates the workflow.
- Level 1 - Tools: Chart.js Tool and RAG Agent as callable tools with defined input/output schemas.
- Level 2 - External Services: Weaviate database connection and LLM API integrations.

### **Acceptance Criteria**

1. A LangGraph StateGraph is created with nodes for the Delegating Agent, Chart.js Tool, and RAG Agent.
1. Conditional edges are defined to route queries based on classification results to appropriate downstream nodes.
1. The Chart.js Tool and RAG Agent are registered as callable tools within the LangGraph workflow.
1. State management is properly implemented to pass context between nodes while maintaining conversation history.
1. The agent graph can be visualized for debugging using LangGraph's built-in visualization capabilities.

# **EPIC-003: RAG Agent**

The Retrieval-Augmented Generation (RAG) Agent is responsible for querying the vector database, retrieving relevant document chunks, and generating comprehensive answers based on the retrieved context. This agent bridges the gap between the user's questions and the knowledge stored in the vector database, enabling accurate and contextual responses with full provenance tracking.

## **US-006: Implement Vector Database Query**

As an **AI Engineer**, I want the **RAG Agent to query the Weaviate database** so that relevant document chunks are retrieved based on semantic similarity to the user's query.

The vector database query is the core retrieval mechanism of the RAG system. Using Weaviate's fetchObjects API when embeddings are not available, or the nearText search when vectorization is enabled, the agent retrieves the most relevant documents based on semantic similarity. This approach ensures that users receive contextually relevant information even when their query doesn't exactly match the stored content.

### **Acceptance Criteria**

1. The RAG Agent connects to Weaviate using the JavaScript client with proper tenant context for multi-tenancy support.
1. When embedding models are unavailable, the agent uses the fetchObjects API to retrieve all objects for the tenant.
1. When embedding models are available, the agent uses nearText or hybrid search for semantic similarity matching.
1. Query results include all object properties: fileId, question, answer, and pageNumber array.
1. Error handling is implemented for database connection failures and empty result sets with appropriate fallback responses.

## **US-007: Generate Answer with References**

As a **User**, I want to **receive answers with file and page references** so that I can verify the source of information and locate the original documents for further reading.

Source attribution is essential for building trust and enabling verification of AI-generated responses. Users need to know which documents and specific pages were used to construct the answer, allowing them to access the original source material for complete context or validation. The reference format should be intuitive and easily understood by non-technical users.

### **Reference Format Specification**

The reference format follows a structured pattern that provides clear attribution while maintaining readability. References are grouped by fileId to avoid redundancy, with multiple page numbers consolidated into a single reference entry.

- Format: "N- Page X" where N is the sequential file index (1, 2, 3...) and X is the page number.
- Multiple pages: "1- Pages 3, 5, 7" for multiple pages from the same document.
- Example: "Based on Document 1- Pages 3, 4 and Document 2- Page 12, the refund policy states..."

### **Acceptance Criteria**

1. The RAG Agent returns an answer string that includes contextual information from retrieved documents.
1. Each referenced file is assigned a sequential index (1, 2, 3...) based on retrieval order.
1. Page numbers from the same fileId are grouped together in the reference output.
1. Reference objects include fileId, page numbers array, and the sequential index for frontend display.
1. The LLM is prompted to incorporate references naturally into the response text using the specified format.

# **EPIC-004: Chart.js Tool**

The Chart.js Tool provides data visualization capabilities within the agent system. For the initial implementation, the tool returns mock Chart.js configurations that can be rendered by frontend applications. This modular approach allows the system to handle visualization requests while providing a clear interface for future enhancements with actual data processing and chart generation logic.

## **US-008: Implement Mock Chart Generation**

As an **AI Engineer**, I want to **implement a mocked Chart.js tool** so that the delegating agent can respond to visualization requests with a valid Chart.js configuration.

The mock Chart.js tool demonstrates the integration pattern for visualization capabilities. By returning a predefined Chart.js configuration object, the tool satisfies the interface requirements while allowing developers to test the complete workflow without implementing complex data transformation logic. This approach follows the progressive enhancement pattern where basic functionality is established first.

### **Mock Configuration Structure**

The mock Chart.js configuration follows the standard Chart.js format, ensuring compatibility with frontend rendering libraries. The configuration includes type specification, data structure with labels and datasets, and styling options.

- type: 'bar' | 'line' | 'pie' | 'doughnut' - Specifies the chart visualization type.
- data: { labels: string[], datasets: Array<{label, data, backgroundColor}> } - Chart data structure.
- options: Object - Chart configuration options including title, legends, and axis labels.

### **Acceptance Criteria**

1. The Chart.js tool is implemented as a LangChain Tool with defined input schema for chart parameters.
1. The tool returns a valid Chart.js configuration object as a JSON string that can be parsed and rendered by frontend.
1. The mock configuration includes sample data with meaningful labels that demonstrate expected output format.
1. The tool is registered with the Delegating Agent as a callable tool with appropriate name and description.
1. Error handling is implemented for invalid input parameters with descriptive error messages.

# **EPIC-005: Integration & Response Streaming**

This epic focuses on the final integration of all components and the implementation of the streaming response format. The system must coordinate between multiple tools, aggregate responses, and deliver a cohesive user experience through a well-defined streaming interface. This represents the culmination of the project, bringing together all previously developed components into a unified system.

## **US-009: Implement Parallel Tool Execution**

As a **System Architect**, I want the **Delegating Agent to execute tools in parallel** so that complex queries requiring both chart generation and data retrieval are processed efficiently.

Parallel execution significantly improves response times for complex queries that require multiple tools. By executing independent tools simultaneously, the system minimizes latency and provides faster responses to users. LangGraph supports parallel execution through its graph structure, allowing multiple tool invocations to proceed concurrently when there are no dependencies between them.

### **Acceptance Criteria**

1. The LangGraph workflow supports parallel branch execution when queries require multiple tools.
1. The Chart.js Tool and RAG Agent can be invoked simultaneously when the query classification indicates both are needed.
1. Results from parallel executions are properly aggregated in the final response without data loss or corruption.
1. Sequential execution is supported for queries where tool outputs are needed as inputs for subsequent tools.
1. Error in one tool does not prevent other parallel tools from completing; partial results are still returned.

## **US-010: Implement Streaming Response Format**

As a **Frontend Developer**, I want to **receive streaming responses with structured data** so that the UI can progressively display the answer while processing references and chart configurations.

Streaming responses provide a better user experience by displaying content as it's generated rather than waiting for the complete response. This is particularly important for LLM-generated content, which can take several seconds to complete. The structured format ensures that metadata like references and chart configurations are cleanly separated from the text content.

### **Response Schema Definition**

| **Field** | **Type** |                  **Description**                  |
| :-------: | :------: | :-----------------------------------------------: |
|  answer   |  string  |    Streaming text chunks of the agent's answer    |
|   data    | object[] | Array of reference objects (RAG or Chart.js data) |

_Table 4: Streaming Response Schema_

### **Data Object Types**

The data array can contain different types of reference objects depending on which tools were invoked. Each type has a distinct structure while sharing common fields for consistent handling by the frontend application.

- RAG Reference: { type: 'rag', fileId: string, index: number, pages: string[], snippet?: string }
- Chart.js Config: { type: 'chart', config: object, title?: string }

### **Acceptance Criteria**

- Response streaming is implemented using Node.js streams or async generators for real-time content delivery.
- Each streaming chunk contains partial answer text that can be progressively displayed in the UI.
- The final chunk includes the complete data array with all reference objects accumulated during processing.
- RAG references are properly formatted with sequential file indices and grouped page numbers.
- Chart.js configurations are valid JSON objects that can be directly used by frontend Chart.js library.

# **Technical Architecture**

The technical architecture follows a layered approach that separates concerns and enables independent scaling of components. Each layer has a specific responsibility and communicates with adjacent layers through well-defined interfaces. This architecture supports both development flexibility and production reliability.

## **System Component Diagram**

The system architecture consists of four primary layers: Presentation, Orchestration, Processing, and Data. Each layer encapsulates specific functionality and communicates through standardized interfaces, enabling modular development and independent testing.

- Presentation Layer: API endpoints for user interaction, request validation, and response formatting.
- Orchestration Layer: LangGraph Delegating Agent managing workflow, tool selection, and state management.
- Processing Layer: RAG Agent and Chart.js Tool implementations with LLM integration.
- Data Layer: Weaviate vector database for document storage and retrieval with multi-tenancy.

# **Dependencies & Task Sequencing**

Understanding dependencies between user stories is crucial for effective sprint planning and resource allocation. The following section outlines the relationships between stories and provides guidance on implementation order to minimize blockers and rework.

## **Story Dependency Matrix**

| **Story ID** |     **Depends On**     |    **Sprint Recommendation**    |
| :----------: | :--------------------: | :-----------------------------: |
|    US-001    |          None          | Sprint 1 - Infrastructure setup |
|    US-002    |         US-001         |    Sprint 1 - Schema design     |
|    US-003    |     US-001, US-002     |   Sprint 1 - Data population    |
|    US-004    |    None (parallel)     |     Sprint 2 - Agent logic      |
|    US-005    |         US-004         |   Sprint 2 - Graph structure    |
|    US-006    |         US-003         |  Sprint 2 - RAG implementation  |
|    US-007    |         US-006         | Sprint 2 - Reference formatting |
|    US-008    |    None (parallel)     |      Sprint 2 - Mock tool       |
|    US-009    | US-005, US-006, US-008 |     Sprint 3 - Integration      |
|    US-010    |         US-009         |   Sprint 3 - Response format    |

_Table 5: User Story Dependency Matrix and Sprint Recommendations_

# **Sprint Planning Recommendations**

Based on the dependency analysis and story complexity, the following sprint structure is recommended for a team of 2-3 developers. Each sprint is planned for a two-week duration, with clear deliverables and demo points at the end of each sprint.

## **Sprint 1: Infrastructure Foundation (Week 1-2)**

The first sprint focuses exclusively on EPIC-001, establishing the technical foundation upon which all subsequent work depends. This includes Docker containerization, database schema design, and initial data population. By completing these foundational elements first, the team ensures that subsequent sprints can proceed without infrastructure blockers.

- Sprint Goal: Establish a working Weaviate vector database with multi-tenancy support and test data.
- Stories: US-001, US-002, US-003
- Deliverable: Docker Compose file, schema creation script, and populated test database.

## **Sprint 2: Agent Development (Week 3-4)**

The second sprint tackles the core agent logic and tool implementations. With the database infrastructure in place, the team can focus on building the Delegating Agent, RAG Agent, and Chart.js Tool. These components can be developed in parallel by different team members, maximizing productivity.

- Sprint Goal: Implement functional agents that can process queries and return responses.
- Stories: US-004, US-005, US-006, US-007, US-008
- Deliverable: Working LangGraph agent hierarchy with individual tool tests passing.

## **Sprint 3: Integration & Polish (Week 5-6)**

The final sprint integrates all components into a cohesive system, implements streaming responses, and addresses any remaining edge cases. This sprint also includes performance optimization, error handling improvements, and documentation completion.

- Sprint Goal: Deliver a fully integrated system with streaming responses and production-ready error handling.
- Stories: US-009, US-010
- Deliverable: Complete system with API endpoints, documentation, and deployment guide.

# **Appendix: Technical Reference**

## **Weaviate Docker Configuration Template**

The following template provides a starting point for the Weaviate Docker configuration. Developers should customize the environment variables based on their specific requirements, including authentication settings and module configurations.

version: '3.8' services: weaviate: image: semitechnologies/weaviate:latest ports: - '8080:8080' environment: QUERY_DEFAULTS_LIMIT: 25 AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: true PERSISTENCE_DATA_PATH: '/var/lib/weaviate' volumes: - weaviate_data:/var/lib/weaviate volumes: weaviate_data:

## **LangGraph State Schema Reference**

The state schema defines the structure of the conversation state that flows through the LangGraph workflow. This schema should be implemented as a TypeScript interface or Python TypedDict for type safety and documentation purposes.

interface AgentState { messages: Message[]; query: string; classification: 'chart' | 'rag' | 'direct' | 'hybrid'; toolResults: ToolResult[]; finalAnswer: string; dataReferences: DataReference[]; }

## **Environment Variables Checklist**

The following environment variables must be configured before running the application. These variables control database connections, LLM API access, and application behavior across different deployment environments.

- WEAVIATE_HOST: URL of the Weaviate instance (default: http://localhost:8080)
- WEAVIATE_API_KEY: Optional API key for Weaviate authentication
- LLM_PROVIDER: 'gemini' or 'local' to specify the LLM backend
- GOOGLE_API_KEY: API key for Google Gemini (if using Gemini)
- LOCAL_LLM_ENDPOINT: Endpoint for local LLM instance (if using local)
- DEFAULT_TENANT: Default tenant ID for multi-tenant operations
  Page of
