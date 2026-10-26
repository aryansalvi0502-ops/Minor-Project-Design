"""
Official MIT Academy of Engineering (MITAOE), Alandi, Pune Curriculum Dataset.
Sourced and verified from official catalogs and course structures:
- Programs: https://mitaoe.ac.in/Programs.php
- B.Tech Curriculum: https://mitaoe.ac.in/BTECH/
- Computer Engineering Course Structure: https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php
"""

from typing import List, Dict, Any

MITAOE_PROGRAMS = [
    {
        "program_name": "Computer Engineering",
        "department": "School of Computer Engineering and Technology",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Computer Science & Engineering (Artificial Intelligence and Machine Learning)",
        "department": "School of Computer Engineering and Technology",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Computer Science & Engineering (Data Science)",
        "department": "School of Computer Engineering and Technology",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Information Technology",
        "department": "School of Computer Engineering and Technology",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Electronics and Telecommunication Engineering",
        "department": "School of Electrical Engineering",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Mechanical Engineering",
        "department": "School of Mechanical and Civil Engineering",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Civil Engineering",
        "department": "School of Mechanical and Civil Engineering",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
    {
        "program_name": "Chemical Engineering",
        "department": "School of Chemical Engineering",
        "degree_type": "B.Tech",
        "duration_years": 4,
        "is_active": True,
    },
]

# Official Course structure mapped to departments and semesters
OFFICIAL_MITAOE_COURSES = [
    # ---- FIRST YEAR (Common Foundation Across MITAOE) ----
    # Semester 1
    {
        "program_name": "Computer Engineering",
        "semester": 1,
        "course_code": "AS101",
        "course_title": "Engineering Mathematics I",
        "credits": 4.0,
        "course_type": "NSC",
        "syllabus_topics": ["Linear Algebra & Matrices", "Differential Calculus", "Taylor & Maclaurin Series", "Partial Differentiation", "Applications of Multivariable Calculus"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 1,
        "course_code": "AS102",
        "course_title": "Engineering Physics",
        "credits": 3.0,
        "course_type": "NSC",
        "syllabus_topics": ["Wave Optics & Interference", "Lasers & Fiber Optics", "Quantum Mechanics Foundations", "Semiconductor Physics", "Nanomaterials"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 1,
        "course_code": "CS101",
        "course_title": "Fundamentals of Programming & Problem Solving",
        "credits": 4.0,
        "course_type": "ESC",
        "syllabus_topics": ["Algorithm Formulation & Flowcharts", "C/Python Control Structures", "Functions & Recursion", "Arrays & String Manipulation", "File Handling"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 1,
        "course_code": "EX101",
        "course_title": "Basics of Electronics Engineering",
        "credits": 3.0,
        "course_type": "ESC",
        "syllabus_topics": ["Diode Circuits & Rectifiers", "Bipolar Junction Transistors (BJT)", "Operational Amplifiers (Op-Amps)", "Logic Gates & Digital Boolean Algebra", "Sensor Interfacing"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 1,
        "course_code": "HP101",
        "course_title": "Effective Communication Skills",
        "credits": 2.0,
        "course_type": "HSSM",
        "syllabus_topics": ["Technical Vocabulary", "Professional Email & Report Writing", "Group Discussions", "Presentation Skills"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # Semester 2
    {
        "program_name": "Computer Engineering",
        "semester": 2,
        "course_code": "AS103",
        "course_title": "Engineering Mathematics II",
        "credits": 4.0,
        "course_type": "NSC",
        "syllabus_topics": ["Ordinary Differential Equations", "Laplace Transforms", "Multiple Integrals", "Vector Calculus & Line Integrals"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 2,
        "course_code": "AS104",
        "course_title": "Engineering Chemistry",
        "credits": 3.0,
        "course_type": "NSC",
        "syllabus_topics": ["Water Treatment & Hardness", "Corrosion Science & Prevention", "Polymer Chemistry", "Fuels & Combustion Energy"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 2,
        "course_code": "CS102",
        "course_title": "Object Oriented Programming Paradigm",
        "credits": 4.0,
        "course_type": "ESC",
        "syllabus_topics": ["Classes & Objects", "Inheritance & Polymorphism", "Virtual Functions & Dynamic Binding", "Exception Handling", "Standard Template Library (STL)"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 2,
        "course_code": "ME101",
        "course_title": "Engineering Graphics & Design",
        "credits": 3.0,
        "course_type": "ESC",
        "syllabus_topics": ["Orthographic Projections", "Isometric Projections", "CAD 2D Drafting", "Solid Modeling Basics"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # ---- SECOND YEAR (Semester 3 & 4) ----
    # Semester 3
    {
        "program_name": "Computer Engineering",
        "semester": 3,
        "course_code": "CS201",
        "course_title": "Data Structures & Algorithms",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Linear Data Structures (Arrays, Linked Lists, Stacks, Queues)", "Trees & Binary Search Trees (BST)", "Graph Representations & Traversals (BFS, DFS)", "Hashing Techniques", "Sorting & Searching Complexity"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 3,
        "course_code": "CS202",
        "course_title": "Discrete Mathematics & Graph Theory",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Propositional & Predicate Logic", "Set Theory & Relations", "Combinatorics & Generating Functions", "Graph Theory & Trees", "Algebraic Structures & Groups"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 3,
        "course_code": "ET206",
        "course_title": "Digital Electronics & Logic Design",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Combinational Circuit Design", "Karnaugh Maps & Minimization", "Sequential Circuits (Flip-Flops, Registers)", "State Machines & Synchronous Counters", "Logic Families (TTL, CMOS)"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 3,
        "course_code": "CS203",
        "course_title": "Computer Organization & Architecture",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Instruction Set Architecture (ISA)", "ALU & Computer Arithmetic", "Processor Control Unit Design", "Pipelining & Hazards", "Memory Hierarchy & Cache Design"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 3,
        "course_code": "HP201",
        "course_title": "Design Thinking & Innovation",
        "credits": 2.0,
        "course_type": "HSSM",
        "syllabus_topics": ["Empathy Mapping & User Research", "Problem Framing & Ideation", "Rapid Prototyping", "User Testing & Iteration"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # Semester 4
    {
        "program_name": "Computer Engineering",
        "semester": 4,
        "course_code": "CS211",
        "course_title": "Database Management Systems",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Relational Model & ER Diagrams", "SQL Queries & Views", "Relational Algebra & Normalization (1NF to BCNF)", "Transaction Management & ACID Properties", "Concurrency Control & Crash Recovery"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 4,
        "course_code": "CS212",
        "course_title": "Operating Systems & Systems Programming",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Process Lifecycle & CPU Scheduling", "Process Synchronization & Semaphores", "Deadlock Detection & Avoidance", "Memory Management & Paging/Segmentation", "Virtual Memory & Page Replacement", "File Systems"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 4,
        "course_code": "CS213",
        "course_title": "Theory of Computation & Automata",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Finite Automata (DFA, NFA)", "Regular Expressions & Pumping Lemma", "Context-Free Grammars & Pushdown Automata", "Turing Machines & Decidability", "Chomsky Hierarchy"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 4,
        "course_code": "AS202",
        "course_title": "Probability & Statistics for Engineers",
        "credits": 3.0,
        "course_type": "NSC",
        "syllabus_topics": ["Random Variables & Distributions", "Hypothesis Testing & Confidence Intervals", "Linear Regression & Correlation", "Bayesian Probability"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # ---- THIRD YEAR (Semester 5 & 6) ----
    # Semester 5
    {
        "program_name": "Computer Engineering",
        "semester": 5,
        "course_code": "CS301",
        "course_title": "Design & Analysis of Algorithms",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Asymptotic Analysis & Recurrences", "Divide and Conquer Paradigms", "Greedy Algorithms & Minimum Spanning Trees", "Dynamic Programming (Knapsack, LCS, Floyd-Warshall)", "Backtracking & Branch-and-Bound", "NP-Completeness"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 5,
        "course_code": "CS302",
        "course_title": "Computer Networks & Protocols",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["OSI & TCP/IP Protocol Stack", "Data Link Layer & Error Control", "Network Layer Routing (Dijkstra, Distance Vector, BGP)", "Transport Layer (TCP Flow & Congestion Control, UDP)", "Application Layer (DNS, HTTP/3, WebSocket)"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 5,
        "course_code": "CS303",
        "course_title": "Software Engineering & Agile Methodologies",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Software Life Cycle Models", "Agile & Scrum Framework", "Requirements Engineering & Use Cases", "UML Modeling & Architecture", "Software Testing & CI/CD Pipelines"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 5,
        "course_code": "CS311",
        "course_title": "Elective I: Artificial Intelligence & Expert Systems",
        "credits": 3.0,
        "course_type": "Elective",
        "syllabus_topics": ["Informed & Uninformed Search (A*, Minimax)", "Knowledge Representation & Ontologies", "Probabilistic Reasoning", "Machine Learning Foundations", "Natural Language Processing Introduction"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 5,
        "course_code": "HP301",
        "course_title": "Environmental Science & Sustainable Development",
        "credits": 2.0,
        "course_type": "HSSM",
        "syllabus_topics": ["Ecosystems & Biodiversity", "Pollution Monitoring & Green Computing", "E-waste Management", "Sustainable Engineering Practices"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # Semester 6
    {
        "program_name": "Computer Engineering",
        "semester": 6,
        "course_code": "CS321",
        "course_title": "Compiler Design & Construction",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Lexical Analysis (Lex/Flex)", "Syntax Analysis & Parsing (LL, LR, Yacc)", "Syntax-Directed Translation", "Intermediate Code Generation (Three-Address Code)", "Code Optimization & Target Code Generation"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 6,
        "course_code": "CS322",
        "course_title": "Information & Network Security",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Classical & Modern Cryptography (AES, RSA)", "Cryptographic Hash Functions & Digital Signatures", "Authentication Protocols & Kerberos", "Firewalls, Intrusion Detection Systems (IDS)", "Web Application Security (OWASP Top 10)"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 6,
        "course_code": "CS323",
        "course_title": "Cloud Computing & Distributed Systems",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Cloud Deployment Models (IaaS, PaaS, SaaS)", "Virtualization & Containerization (Docker, Kubernetes)", "Distributed Consensus & Consistency Models", "MapReduce & Distributed Storage (HDFS)", "Serverless Computing"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 6,
        "course_code": "CS331",
        "course_title": "Elective II: Deep Learning & Neural Networks",
        "credits": 3.0,
        "course_type": "Elective",
        "syllabus_topics": ["Perceptrons & Backpropagation", "Convolutional Neural Networks (CNNs)", "Recurrent Neural Networks (RNNs & LSTMs)", "Transformer Architectures & Attention Mechanisms", "Model Deployment & ONNX"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 6,
        "course_code": "CS341",
        "course_title": "Mini Project with Capstone Preparation",
        "credits": 2.0,
        "course_type": "Project",
        "syllabus_topics": ["Literature Survey & Problem Formulation", "System Architecture & Prototyping", "Peer Review & Demonstration"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # ---- FOURTH YEAR (Semester 7 & 8) ----
    # Semester 7
    {
        "program_name": "Computer Engineering",
        "semester": 7,
        "course_code": "CS401",
        "course_title": "High Performance Computing & GPU Architecture",
        "credits": 3.0,
        "course_type": "Core",
        "syllabus_topics": ["Parallel Architecture Models", "OpenMP & Multi-threading", "MPI (Message Passing Interface)", "CUDA Programming & GPU Kernels"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 7,
        "course_code": "CS411",
        "course_title": "Elective III: Big Data Analytics & Data Lakes",
        "credits": 3.0,
        "course_type": "Elective",
        "syllabus_topics": ["Big Data Architecture", "Apache Spark & Stream Processing", "NoSQL Databases (MongoDB, Cassandra)", "Data Pipelines & ETL"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 7,
        "course_code": "CS465",
        "course_title": "Major Capstone Project Stage I",
        "credits": 4.0,
        "course_type": "Project",
        "syllabus_topics": ["Domain Research", "Architecture Design & Benchmarking", "Interim Evaluation"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # Semester 8
    {
        "program_name": "Computer Engineering",
        "semester": 8,
        "course_code": "CS431",
        "course_title": "Elective IV: Blockchain Technology & Smart Contracts",
        "credits": 3.0,
        "course_type": "Elective",
        "syllabus_topics": ["Consensus Mechanisms (PoW, PoS)", "Ethereum & Solidity Smart Contracts", "DeFi & Web3 Architecture", "Security Auditing of Smart Contracts"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Engineering",
        "semester": 8,
        "course_code": "CS466",
        "course_title": "Major Capstone Project Stage II & Industry Internship",
        "credits": 6.0,
        "course_type": "Project",
        "syllabus_topics": ["Final Implementation", "Empirical Testing & Performance Validation", "Research Paper Drafting & Defense"],
        "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php",
        "verification_status": "verified"
    },

    # ---- CSE (AI & ML) SPECIFIC COURSES ----
    {
        "program_name": "Computer Science & Engineering (Artificial Intelligence and Machine Learning)",
        "semester": 3,
        "course_code": "AI201",
        "course_title": "Foundations of AI & Knowledge Systems",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["State-Space Search & Heuristics", "Adversarial Search & Game Playing", "Constraint Satisfaction Problems", "Knowledge Representation"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Science & Engineering (Artificial Intelligence and Machine Learning)",
        "semester": 4,
        "course_code": "AI211",
        "course_title": "Supervised & Unsupervised Machine Learning",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Linear & Logistic Regression", "Decision Trees & Random Forests", "SVMs & Kernel Methods", "Clustering & PCA Dimensionality Reduction"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Science & Engineering (Artificial Intelligence and Machine Learning)",
        "semester": 5,
        "course_code": "AI301",
        "course_title": "Deep Neural Architectures & Computer Vision",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["CNN Architectures (ResNet, EfficientNet)", "Object Detection (YOLO, Faster R-CNN)", "Image Segmentation", "Transfer Learning"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Science & Engineering (Artificial Intelligence and Machine Learning)",
        "semester": 6,
        "course_code": "AI321",
        "course_title": "Natural Language Processing & Large Language Models",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Word Embeddings & Seq2Seq", "Transformers & Self-Attention", "BERT, GPT & Fine-tuning", "Prompt Engineering & RAG Systems"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },

    # ---- CSE (DATA SCIENCE) SPECIFIC COURSES ----
    {
        "program_name": "Computer Science & Engineering (Data Science)",
        "semester": 3,
        "course_code": "DS201",
        "course_title": "Data Wrangling & Exploratory Analysis",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Data Cleaning & Imputation", "Feature Engineering", "Statistical Hypothesis Testing", "Data Visualization with Seaborn/Plotly"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Science & Engineering (Data Science)",
        "semester": 4,
        "course_code": "DS211",
        "course_title": "Applied Statistics & Predictive Modeling",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Multivariate Analysis", "Time Series Forecasting (ARIMA, Prophet)", "Survival Analysis", "Monte Carlo Simulations"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Computer Science & Engineering (Data Science)",
        "semester": 5,
        "course_code": "DS301",
        "course_title": "Data Engineering & Stream Pipelines",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Kafka & Distributed Messaging", "Apache Flink / Spark Streaming", "Data Warehousing (Snowflake, BigQuery)", "Delta Lake Architecture"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },

    # ---- INFORMATION TECHNOLOGY SPECIFIC COURSES ----
    {
        "program_name": "Information Technology",
        "semester": 3,
        "course_code": "IT201",
        "course_title": "Data Structures & Applications",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Linear & Non-Linear Structures", "Graph Algorithms", "Hashing & Inverted Indexes", "Memory Optimization"],
        "source_url": "https://mitaoe.ac.in/BTECH/",
        "verification_status": "verified"
    },
    {
        "program_name": "Information Technology",
        "semester": 4,
        "course_code": "IT211",
        "course_title": "Web Architecture & Full Stack Technologies",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["REST APIs & Microservices", "Modern Frontend Frameworks", "Database ORM & Caching (Redis)", "Authentication & OAuth2"],
        "source_url": "https://mitaoe.ac.in/BTECH/",
        "verification_status": "verified"
    },
    {
        "program_name": "Information Technology",
        "semester": 5,
        "course_code": "IT301",
        "course_title": "Cyber Threat Intelligence & Incident Response",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Threat Vectors & MITRE ATT&CK", "Network Forensics", "SIEM & Log Analysis", "Vulnerability Assessment & Pen Testing"],
        "source_url": "https://mitaoe.ac.in/BTECH/",
        "verification_status": "verified"
    },

    # ---- ELECTRONICS AND TELECOMMUNICATION SPECIFIC COURSES ----
    {
        "program_name": "Electronics and Telecommunication Engineering",
        "semester": 3,
        "course_code": "ET201",
        "course_title": "Signals & Systems",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Continuous & Discrete Time Signals", "LTI Systems & Convolution", "Fourier & Z-Transforms", "State-Space Analysis"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Electronics and Telecommunication Engineering",
        "semester": 4,
        "course_code": "ET211",
        "course_title": "Analog & Digital Communication",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["AM, FM Modulation & Demodulation", "PCM, DPCM & Delta Modulation", "Digital Modulation (QPSK, QAM)", "Noise Analysis in Comm Channels"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Electronics and Telecommunication Engineering",
        "semester": 5,
        "course_code": "ET301",
        "course_title": "Microcontrollers & Embedded IoT",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["ARM Cortex Architecture", "Embedded C Programming", "RTOS Fundamentals", "IoT Protocols (MQTT, CoAP)"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },

    # ---- MECHANICAL ENGINEERING SPECIFIC COURSES ----
    {
        "program_name": "Mechanical Engineering",
        "semester": 3,
        "course_code": "ME201",
        "course_title": "Thermodynamics & Heat Transfer",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Laws of Thermodynamics", "Air Standard Cycles (Carnot, Otto, Diesel)", "Conduction, Convection & Radiation", "Heat Exchangers"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Mechanical Engineering",
        "semester": 4,
        "course_code": "ME211",
        "course_title": "Fluid Mechanics & Machinery",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Fluid Statics & Dynamics (Bernoulli Equation)", "Flow Through Pipes & Losses", "Hydraulic Turbines & Pumps", "Dimensional Analysis"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },

    # ---- CIVIL ENGINEERING SPECIFIC COURSES ----
    {
        "program_name": "Civil Engineering",
        "semester": 3,
        "course_code": "CV201",
        "course_title": "Mechanics of Structures",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Stress-Strain Analysis", "Shear Force & Bending Moment Diagrams", "Bending & Shear Stresses in Beams", "Torsion of Circular Shafts"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Civil Engineering",
        "semester": 4,
        "course_code": "CV211",
        "course_title": "Surveying & Geomatics",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Theodolite Surveying & Traversing", "Leveling & Contouring", "Total Station & GPS Surveying", "Remote Sensing & GIS"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },

    # ---- CHEMICAL ENGINEERING SPECIFIC COURSES ----
    {
        "program_name": "Chemical Engineering",
        "semester": 3,
        "course_code": "CH201",
        "course_title": "Process Calculations & Mass Balances",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Material Balances Without Reaction", "Material Balances With Chemical Reactions", "Recycle, Bypass & Purge Calculations", "Energy Balances"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    },
    {
        "program_name": "Chemical Engineering",
        "semester": 4,
        "course_code": "CH211",
        "course_title": "Chemical Reaction Engineering",
        "credits": 4.0,
        "course_type": "Core",
        "syllabus_topics": ["Reaction Kinetics & Rate Laws", "Batch, CSTR & PFR Reactor Design", "Multiple Reactions & Yield Optimization", "Non-Ideal Flow & Residence Time Distribution"],
        "source_url": "https://mitaoe.ac.in/Programs.php",
        "verification_status": "verified"
    }
]
