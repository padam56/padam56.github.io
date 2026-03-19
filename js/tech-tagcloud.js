(function() {
  "use strict";

  var container = document.getElementById("tagcloud");
  if (!container) return;

  var activeLabel = document.getElementById("tech-cloud-active");
  var contextLabel = document.getElementById("tech-cloud-context");
  var stackList = document.getElementById("tech-stack-list");
  var stackSummary = document.getElementById("tech-stack-summary");
  var conceptsBoard = document.getElementById("tech-concepts-board");
  var storyToggle = document.getElementById("tech-story-toggle");
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll(".tech_mode_btn"));

  var stacks = [
    // CLOUD
    { name: "AWS", icon: "img/tech/aws.svg", url: "https://aws.amazon.com/", category: "cloud", project: "Levee Monitoring and Fault Detection WebApp", context: "Cloud platform for deployment and hosting." },
    { name: "Google Cloud", icon: "img/tech/google-cloud.svg", url: "https://cloud.google.com/", category: "cloud", project: "Global Sales Dashboard", context: "Cloud-native workloads and managed services." },
    { name: "Kubernetes", icon: "img/tech/kubernetes.svg", url: "https://kubernetes.io/", category: "cloud", project: "Levee Monitoring and Fault Detection WebApp", context: "Container orchestration at scale." },
    { name: "Helm", icon: "img/tech/kubernetes.svg", url: "https://helm.sh/", category: "cloud", project: "Global Sales Dashboard", context: "Kubernetes package management for repeatable deployments." },
    { name: "Argo CD", icon: "img/tech/kubernetes.svg", url: "https://argo-cd.readthedocs.io/", category: "cloud", project: "Global Sales Dashboard", context: "GitOps continuous delivery for Kubernetes clusters." },
    { name: "Terraform", icon: "img/tech/terraform.svg", url: "https://www.terraform.io/", category: "cloud", project: "Global Sales Dashboard", context: "Infrastructure as code provisioning." },
    { name: "CircleCI", icon: "img/tech/circleci.svg", url: "https://circleci.com/", category: "cloud", project: "Global Sales Dashboard", context: "Cloud CI pipelines for releases." },

    // JAVA (CV job experience)
    { name: "Spring Boot", icon: "img/tech/spring-boot.svg", url: "https://spring.io/projects/spring-boot", category: "java", project: "Global Sales Dashboard", context: "Microservice architecture for production Java services." },
    { name: "Java", icon: "img/tech/java.svg", url: "https://www.java.com/", category: "java", project: "Global Sales Dashboard", context: "Core language for enterprise backend development." },
    { name: "Kafka", icon: "img/tech/kafka.svg", url: "https://kafka.apache.org/", category: "java", project: "Global Sales Dashboard", context: "Event streaming backbone for asynchronous microservice updates." },
    { name: "PostgreSQL", icon: "img/tech/postgresql.svg", url: "https://www.postgresql.org/", category: "java", project: "Global Sales Dashboard", context: "Transactional relational datastore for service workloads." },
    { name: "Redis", icon: "img/tech/redis.svg", url: "https://redis.io/", category: "java", project: "Global Sales Dashboard", context: "Low-latency caching for faster API responses." },
    { name: "Docker", icon: "img/tech/docker.svg", url: "https://www.docker.com/", category: "java", project: "Global Sales Dashboard", context: "Containerized Java services for consistent releases." },
    { name: "Angular 16/14", icon: "img/tech/angular.svg", url: "https://angular.io/", category: "java", project: "Global Sales Dashboard", context: "Interactive frontend dashboards for equity and vesting analytics." },
    { name: "Angular CLI", icon: "img/tech/angular.svg", url: "https://angular.io/cli", category: "java", project: "Global Sales Dashboard", context: "Scaffold and build tooling for Angular development lifecycle." },
    { name: "RxJS", icon: "img/tech/rxjs.svg", url: "https://rxjs.dev/", category: "java", project: "Global Sales Dashboard", context: "Reactive streams for real-time data updates and UI reactivity." },
    { name: "Bootstrap", icon: "img/tech/bootstrap.svg", url: "https://getbootstrap.com/", category: "java", project: "Global Sales Dashboard", context: "Responsive layout framework for cross-browser frontend compatibility." },
    { name: "OAuth2 RBAC", icon: "img/tech/oauth.svg", url: "https://oauth.net/2/", category: "java", project: "Global Sales Dashboard", context: "Role-based authorization across service endpoints and user roles." },
    { name: "JWT Auth", icon: "img/tech/jwt.svg", url: "https://jwt.io/", category: "java", project: "Global Sales Dashboard", context: "Token-based authentication for protected API access." },
    { name: "Splunk Monitoring", icon: "img/tech/splunk.svg", url: "https://www.splunk.com/", category: "java", project: "Global Sales Dashboard", context: "Centralized dashboards and observability for proactive incident handling." },
    { name: "JUnit", icon: "img/tech/junit.svg", url: "https://junit.org/junit5/", category: "java", project: "Global Sales Dashboard", context: "Unit and integration testing for Java service reliability." },
    { name: "Mockito", icon: "img/tech/mockito.svg", url: "https://site.mockito.org/", category: "java", project: "Global Sales Dashboard", context: "Mock-based service testing for isolated validation of integrations." },
    { name: "Spring AOP", icon: "img/tech/spring-aop.svg", url: "https://docs.spring.io/spring-framework/reference/core/aop.html", category: "java", project: "Global Sales Dashboard", context: "Cross-cutting logging and error handling in modular service layers." },
    { name: "Groovy", icon: "img/tech/groovy.svg", url: "https://groovy-lang.org/", category: "java", project: "Global Sales Dashboard", context: "Jenkins pipeline scripting for deployment automation." },
    { name: "GitHub CI/CD", icon: "img/tech/github-actions.svg", url: "https://github.com/features/actions", category: "java", project: "Global Sales Dashboard", context: "Automated build, test, and deployment pipeline orchestration." },
    { name: "Python Jobs", icon: "img/tech/python.svg", url: "https://www.python.org/", category: "java", project: "Global Sales Dashboard", context: "Data ingestion and scheduled background processing scripts." },
    { name: "Jenkins", icon: "img/tech/jenkins.svg", url: "https://www.jenkins.io/", category: "java", project: "Global Sales Dashboard", context: "CI/CD pipelines for Java build and deployment workflows." },
    { name: "GitHub Actions", icon: "img/tech/github-actions.svg", url: "https://github.com/features/actions", category: "java", project: "Global Sales Dashboard", context: "Automated test and deployment workflows." },
    { name: "REST Assured", icon: "img/tech/java.svg", url: "https://rest-assured.io/", category: "java", project: "Global Sales Dashboard", context: "API contract and integration test automation in Java." },
    { name: "TestNG", icon: "img/tech/junit.svg", url: "https://testng.org/", category: "java", project: "Global Sales Dashboard", context: "Parallel test orchestration and suite management for regression testing." },

    // BACKEND
    { name: "Django", icon: "img/tech/django.svg", url: "https://www.djangoproject.com/", category: "backend", project: "Levee Monitoring and Fault Detection WebApp", context: "Structured backend API development." },
    { name: "Flask", icon: "img/tech/flask.svg", url: "https://flask.palletsprojects.com/", category: "backend", project: "Natural Language Processing Projects", context: "Lightweight REST API services." },
    { name: "FastAPI", icon: "img/tech/fastapi.svg", url: "https://fastapi.tiangolo.com/", category: "backend", project: "Levee Monitoring and Fault Detection WebApp", context: "High-performance Python APIs." },
    { name: "MongoDB", icon: "img/tech/mongodb.svg", url: "https://www.mongodb.com/", category: "backend", project: "Global Sales Dashboard", context: "Document database for flexible schema and high-throughput API workloads." },
    { name: "MySQL", icon: "img/tech/mysql.svg", url: "https://www.mysql.com/", category: "backend", project: "Global Sales Dashboard", context: "Operational SQL workloads." },
    { name: "Nginx", icon: "img/tech/nginx.svg", url: "https://www.nginx.com/", category: "backend", project: "Levee Monitoring and Fault Detection WebApp", context: "Gateway and traffic routing layer." },
    { name: "GraphQL", icon: "img/tech/typescript.svg", url: "https://graphql.org/", category: "backend", project: "Natural Language Processing Projects", context: "Typed query APIs for flexible client-driven data retrieval." },
    { name: "RabbitMQ", icon: "img/tech/kafka.svg", url: "https://www.rabbitmq.com/", category: "backend", project: "Global Sales Dashboard", context: "Message broker for asynchronous backend workflows." },
    { name: "OpenTelemetry", icon: "img/tech/splunk.svg", url: "https://opentelemetry.io/", category: "backend", project: "Global Sales Dashboard", context: "Distributed tracing and telemetry instrumentation standards." },
    { name: "JavaScript", icon: "img/tech/javascript.svg", url: "https://www.javascript.com/", category: "backend", project: "Natural Language Processing Projects", context: "Runtime scripting across the stack." },
    { name: "TypeScript", icon: "img/tech/typescript.svg", url: "https://www.typescriptlang.org/", category: "backend", project: "Global Sales Dashboard", context: "Typed full-stack development." },
    { name: "React", icon: "img/tech/react.svg", url: "https://react.dev/", category: "backend", project: "Levee Monitoring and Fault Detection WebApp", context: "UI framework in app stack." },
    { name: "Angular", icon: "img/tech/angular.svg", url: "https://angular.io/", category: "backend", project: "Global Sales Dashboard", context: "Enterprise frontend framework usage." },
    { name: "Elasticsearch", icon: "img/tech/elasticsearch.svg", url: "https://www.elastic.co/elasticsearch", category: "backend", project: "Global Sales Dashboard", context: "Distributed search and analytics engine." },
    { name: "Sass", icon: "img/tech/sass.svg", url: "https://sass-lang.com/", category: "backend", project: "Global Sales Dashboard", context: "CSS preprocessor for scalable styling." },
    { name: "Dart", icon: "img/tech/dart.svg", url: "https://dart.dev/", category: "backend", project: "Natural Language Processing Projects", context: "Application development language." },
    { name: "Flutter", icon: "img/tech/flutter.svg", url: "https://flutter.dev/", category: "backend", project: "Natural Language Processing Projects", context: "Cross-platform UI toolkit." },

    // SECURITY (12)
    { name: "Selenium", icon: "img/tech/selenium.svg", url: "https://www.selenium.dev/", category: "security", project: "MTD-Research", context: "Browser automation for security testing." },
    { name: "Playwright", icon: "img/tech/playwright.svg", url: "https://playwright.dev/", category: "security", project: "MTD-Research", context: "Modern browser automation and capture." },
    { name: "Cypress", icon: "img/tech/playwright.svg", url: "https://www.cypress.io/", category: "security", project: "MTD-Research", context: "Frontend end-to-end testing for deterministic UI regression coverage." },
    { name: "Pytest", icon: "img/tech/python.svg", url: "https://docs.pytest.org/", category: "security", project: "MTD-Research", context: "Python test framework for unit, integration, and API validation." },
    { name: "k6", icon: "img/tech/javascript.svg", url: "https://k6.io/", category: "security", project: "MTD-Research", context: "Performance and load testing for reliability under traffic spikes." },
    { name: "OAuth2", icon: "img/tech/oauth.svg", url: "https://oauth.net/2/", category: "security", project: "Global Sales Dashboard", context: "Authorization protocol for secure APIs." },
    { name: "JWT", icon: "img/tech/jwt.svg", url: "https://jwt.io/", category: "security", project: "Global Sales Dashboard", context: "Token-based authentication pattern." },
    { name: "Splunk", icon: "img/tech/splunk.svg", url: "https://www.splunk.com/", category: "security", project: "Global Sales Dashboard", context: "Security telemetry and monitoring." },
    { name: "Linux", icon: "img/tech/linux.svg", url: "https://www.linux.org/", category: "security", project: "MTD-Research", context: "Primary security research environment." },
    { name: "Git", icon: "img/tech/git.svg", url: "https://git-scm.com/", category: "security", project: "MTD-Research", context: "Version control with secure workflows." },
    { name: "GitHub", icon: "img/tech/github.svg", url: "https://github.com/", category: "security", project: "MTD-Research", context: "Code review and repository security controls." },
    { name: "Appium", icon: "img/tech/appium.svg", url: "https://appium.io/", category: "security", project: "MTD-Research", context: "Mobile automation for analysis." },
    { name: "MobSF", icon: "img/tech/mobsf.svg", url: "https://mobsf.github.io/docs/", category: "security", project: "MTD-Research", context: "Mobile static/dynamic analysis platform." },
    { name: "Puppeteer", icon: "img/tech/puppeteer.svg", url: "https://pptr.dev/", category: "security", project: "MTD-Research", context: "Headless browser security instrumentation." },
    { name: "Scrapy", icon: "img/tech/scrapy.svg", url: "https://scrapy.org/", category: "security", project: "MTD-Research", context: "Crawler stack for threat collection." },

    // ML (14)
    { name: "Python", icon: "img/tech/python.svg", url: "https://www.python.org/", category: "ml", project: "Microsoft Malware Prediction", context: "Core ML programming language." },
    { name: "TensorFlow", icon: "img/tech/tensorflow.svg", url: "https://www.tensorflow.org/", category: "ml", project: "English-to-French Translator", context: "Deep learning framework." },
    { name: "PyTorch", icon: "img/tech/pytorch.svg", url: "https://pytorch.org/", category: "ml", project: "Diabetic Retinopathy Detection", context: "Neural network training framework." },
    { name: "Scikit-learn", icon: "img/tech/scikit-learn.svg", url: "https://scikit-learn.org/", category: "ml", project: "Credit Card Fraud Detection", context: "Classical ML library." },
    { name: "Keras", icon: "img/tech/keras.svg", url: "https://keras.io/", category: "ml", project: "English-to-French Translator", context: "High-level neural network API." },
    { name: "NumPy", icon: "img/tech/numpy.svg", url: "https://numpy.org/", category: "ml", project: "Traffic Sign Classification", context: "Numerical array computing library." },
    { name: "OpenCV", icon: "img/tech/opencv.svg", url: "https://opencv.org/", category: "ml", project: "Diabetic Retinopathy Detection", context: "Computer vision toolkit." },
    { name: "Hugging Face", icon: "img/tech/huggingface.svg", url: "https://huggingface.co/", category: "ml", project: "Natural Language Processing Projects", context: "Transformer models and tooling." },
    { name: "Weights & Biases", icon: "img/tech/wandb.svg", url: "https://wandb.ai/site", category: "ml", project: "Advanced Machine Learning Algorithms", context: "ML experiment tracking platform." },
    { name: "MLflow", icon: "img/tech/mlflow.svg", url: "https://mlflow.org/", category: "ml", project: "Advanced Machine Learning Algorithms", context: "Model lifecycle and experiment management." },
    { name: "BentoML", icon: "img/tech/python.svg", url: "https://www.bentoml.com/", category: "ml", project: "Advanced Machine Learning Algorithms", context: "Model serving framework for production inference APIs." },
    { name: "DVC", icon: "img/tech/dvc.svg", url: "https://dvc.org/", category: "ml", project: "Advanced Machine Learning Algorithms", context: "Data/model versioning tool." },
    { name: "Ray", icon: "img/tech/python.svg", url: "https://www.ray.io/", category: "ml", project: "Advanced Machine Learning Algorithms", context: "Distributed compute and scaling for ML training/inference." },
    { name: "LangChain", icon: "img/tech/langchain.svg", url: "https://www.langchain.com/", category: "ml", project: "Natural Language Processing Projects", context: "LLM application framework." },
    { name: "Weka", icon: "img/tech/weka.svg", url: "https://www.cs.waikato.ac.nz/ml/weka/", category: "ml", project: "Credit Card Fraud Detection", context: "ML workbench for prototyping." },
    { name: "Yellowbrick", icon: "img/tech/yellowbrick.svg", url: "https://www.scikit-yb.org/", category: "ml", project: "Credit Card Fraud Detection", context: "ML visualization helper library." },

    // DATA (12)
    { name: "Pandas", icon: "img/tech/pandas.svg", url: "https://pandas.pydata.org/", category: "data", project: "Document Similarity Analysis", context: "Data wrangling and analysis library." },
    { name: "PySpark", icon: "img/tech/pyspark.svg", url: "https://spark.apache.org/docs/latest/api/python/", category: "data", project: "Pyspark Cryptoanalysis", context: "Distributed data processing stack." },
    { name: "Databricks", icon: "img/tech/databricks.svg", url: "https://www.databricks.com/", category: "data", project: "Global Sales Dashboard", context: "Lakehouse analytics platform." },
    { name: "Dagster", icon: "img/tech/python.svg", url: "https://dagster.io/", category: "data", project: "HYCOM Ocean Data Visualization", context: "Data and ML orchestration with software-defined assets." },
    { name: "Prefect", icon: "img/tech/python.svg", url: "https://www.prefect.io/", category: "data", project: "HYCOM Ocean Data Visualization", context: "Workflow orchestration for resilient ETL/ELT scheduling." },
    { name: "Airflow", icon: "img/tech/python.svg", url: "https://airflow.apache.org/", category: "data", project: "Global Sales Dashboard", context: "Industry-standard DAG scheduling for batch pipelines." },
    { name: "dbt", icon: "img/tech/databricks.svg", url: "https://www.getdbt.com/", category: "data", project: "Global Sales Dashboard", context: "Analytics engineering and SQL transformation workflows." },
    { name: "Streamlit", icon: "img/tech/streamlit.svg", url: "https://streamlit.io/", category: "data", project: "HYCOM Ocean Data Visualization", context: "Data app prototyping framework." },
    { name: "Plotly", icon: "img/tech/plotly.svg", url: "https://plotly.com/", category: "data", project: "HYCOM Ocean Data Visualization", context: "Interactive data visualization library." },
    { name: "Matplotlib", icon: "img/tech/matplotlib.svg", url: "https://matplotlib.org/", category: "data", project: "Data Analysis and Visualization Projects", context: "Scientific plotting library." },
    { name: "R", icon: "img/tech/r.svg", url: "https://www.r-project.org/", category: "data", project: "Credit Card Fraud Detection", context: "Statistical computing language." },
    { name: "Snowflake", icon: "img/tech/snowflake.svg", url: "https://www.snowflake.com/", category: "data", project: "Global Sales Dashboard", context: "Cloud data warehouse platform." },
    { name: "Postman", icon: "img/tech/postman.svg", url: "https://www.postman.com/", category: "data", project: "Global Sales Dashboard", context: "API testing and collection tooling." },
    { name: "Leaflet", icon: "img/tech/leaflet.svg", url: "https://leafletjs.com/", category: "data", project: "HYCOM Ocean Data Visualization", context: "Interactive mapping library." },
    { name: "LaTeX", icon: "img/tech/latex.svg", url: "https://www.latex-project.org/", category: "data", project: "Document Similarity Analysis", context: "Scientific writing and typesetting system." },
    { name: "Cursor", icon: "img/tech/github.svg", url: "https://www.cursor.com/", category: "data", project: "Document Similarity Analysis", context: "AI-assisted development environment for faster engineering loops." },
    { name: "C++", icon: "img/tech/cplusplus.svg", url: "https://isocpp.org/", category: "data", project: "Futoshiki Puzzle Solver", context: "High-performance systems programming language." },
    { name: "C", icon: "img/tech/c.svg", url: "https://en.cppreference.com/w/c", category: "data", project: "Futoshiki Puzzle Solver", context: "Low-level systems language." },
    { name: "Beautiful Soup", icon: "img/tech/beautifulsoup.svg", url: "https://www.crummy.com/software/BeautifulSoup/", category: "data", project: "Document Similarity Analysis", context: "HTML parsing and extraction library." }
  ];

  var conceptByMode = {
    ml: [
      "Computer Vision Pipelines",
      "Real-Time Segmentation",
      "Object Detection",
      "Annotation Automation",
      "Model Quantization",
      "Diffusion Data Augmentation",
      "Inference Optimization",
      "Hyperparameter Tuning",
      "Experiment Tracking",
      "Reproducible ML Workflows"
    ],
    security: [
      "Internet Security Research",
      "Web Measurement",
      "Phishing Campaign Mapping",
      "Scam Ecosystem Analysis",
      "Threat Intelligence Enrichment",
      "Abuse Infrastructure Tracking",
      "Wallet Fraud Monitoring",
      "Domain Lifecycle Monitoring",
      "Automation-Driven Triage",
      "Evidence-Centered Reporting"
    ],
    cloud: [
      "AWS Production Deployment",
      "Containerized Workloads",
      "Kubernetes Orchestration",
      "CI/CD Automation",
      "Infrastructure as Code",
      "Cloud Observability",
      "Scalable Service Topologies",
      "Fault-Tolerant Architecture",
      "Low-Latency Delivery",
      "Release Reliability"
    ],
    java: [
      "Java Microservice Architecture",
      "Spring Boot Service Design",
      "RESTful API Integration",
      "Kafka Event Streaming",
      "Caching for Throughput",
      "CI/CD for Java Pipelines",
      "Role-Based Access Control",
      "Production Monitoring",
      "Operational Reliability"
    ],
    backend: [
      "Spring Boot Microservices",
      "Event-Driven Kafka Flows",
      "REST API Contracts",
      "Token-Based Auth",
      "Caching and State Acceleration",
      "Document Database Design",
      "SQL and NoSQL Integration",
      "Service-Level Monitoring",
      "Backend Performance Tuning",
      "Resilient Error Handling",
      "Production Incident Readiness"
    ],
    data: [
      "Data Quality Controls",
      "ETL and ELT Pipelines",
      "Lakehouse Analytics",
      "Distributed Data Processing",
      "Interactive Dashboards",
      "Time-Series and KPI Tracking",
      "Geospatial Visualization",
      "Anomaly Detection Signals",
      "Statistical Exploration",
      "Insight-to-Action Reporting"
    ]
  };

  function renderConceptBoard(mode) {
    if (!conceptsBoard) return;

    var conceptsWrap = conceptsBoard.parentElement;
    var items = conceptByMode[mode] || [];
    var hidden = mode === "all" || !items.length;

    if (conceptsWrap) {
      conceptsWrap.classList.toggle("is-hidden", hidden);
    }

    if (hidden) {
      conceptsBoard.innerHTML = "";
      return;
    }

    conceptsBoard.innerHTML = items.map(function(item, idx) {
      return '<span class="tech_concept_pill" style="--pill-delay:' + (idx * 0.05).toFixed(2) + 's">' + item + '</span>';
    }).join("");
  }

  function updateStackSummary(mode) {
    if (!stackSummary) return;
    var visible = stacks.filter(function(stack) {
      return mode === "all" || stack.category === mode;
    });
    var title = mode === "all" ? "Stacks" : (mode.toUpperCase() + " Stacks");
    var names = visible.map(function(stack) { return stack.name; }).join(" | ");
    stackSummary.textContent = title + " (" + visible.length + "): " + names;
  }

  function toggleStackList(mode) {
    if (!stackList) return;
    stackList.classList.toggle("is-hidden", mode === "all");
  }

  function spherePoint(index, total) {
    var p = Math.PI * (3 - Math.sqrt(5));
    var y = 1 - ((index + 0.5) / Math.max(total, 1)) * 2;
    var r = Math.sqrt(Math.max(0, 1 - y * y));
    var t = p * index;
    return { x: Math.cos(t) * r, y: y, z: Math.sin(t) * r };
  }

  function showHoverLabel(name) {
    if (!activeLabel) return;
    activeLabel.textContent = name || "";
    activeLabel.classList.add("is-visible");
  }

  function hideHoverLabel() {
    if (!activeLabel) return;
    activeLabel.classList.remove("is-visible");
  }

  function renderSvgFallback() {
    var NS = "http://www.w3.org/2000/svg";
    var XLINK = "http://www.w3.org/1999/xlink";
    var size = 760;
    var center = size / 2;
    var radius = 278;
    var iconBase = 44;
    var phi = Math.PI * (3 - Math.sqrt(5));
    var rotX = -0.14;
    var rotY = 0;
    var velX = 0.0019;
    var velY = 0.017;
    var targetVelX = velX;
    var targetVelY = velY;
    var dragging = false;
    var lastDragX = 0;
    var lastDragY = 0;
    var fallbackMode = "all";
    var fallbackStory = false;
    var fallbackStoryTimer = null;
    var fallbackStoryIndex = -1;
    var categoryCenters = {
      ml: { x: center - 165, y: center - 132 },
      security: { x: center + 158, y: center - 126 },
      cloud: { x: center + 152, y: center + 134 },
      java: { x: center - 6, y: center + 170 },
      backend: { x: center - 158, y: center + 138 },
      data: { x: center, y: center }
    };
    var chipByName = Object.create(null);
    var activeStackName = "";
    var bioDetails = document.querySelector("#about .person_details");

    function openEvidence(stack) {
      window.open(stack.url, "_blank", "noopener,noreferrer");
    }

    function setActiveStack(stack) {
      if (!stack) return;
      activeStackName = stack.name;
      if (activeLabel) activeLabel.textContent = stack.name;
      if (contextLabel) contextLabel.textContent = stack.context;
      Object.keys(chipByName).forEach(function(name) {
        chipByName[name].classList.toggle("is-active", name === stack.name);
      });
    }

    function visibleStacks() {
      return stacks.filter(function(stack) {
        return fallbackMode === "all" || stack.category === fallbackMode;
      });
    }

    function updateModeButtons() {
      modeButtons.forEach(function(btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-tech-mode") === fallbackMode);
      });
    }

    function stopStoryMode() {
      fallbackStory = false;
      if (fallbackStoryTimer) window.clearInterval(fallbackStoryTimer);
      fallbackStoryTimer = null;
      fallbackStoryIndex = -1;
      if (storyToggle) {
        storyToggle.classList.remove("is-active");
        storyToggle.textContent = "Start Story Mode";
        storyToggle.setAttribute("aria-pressed", "false");
      }
    }

    function startStoryMode() {
      stopStoryMode();
      fallbackStory = true;
      if (storyToggle) {
        storyToggle.classList.add("is-active");
        storyToggle.textContent = "Stop Story Mode";
        storyToggle.setAttribute("aria-pressed", "true");
      }

      function stepStory() {
        var visible = visibleStacks();
        if (!visible.length) return;
        fallbackStoryIndex = (fallbackStoryIndex + 1) % visible.length;
        setActiveStack(visible[fallbackStoryIndex]);
      }

      stepStory();
      fallbackStoryTimer = window.setInterval(stepStory, 2800);
    }

    function setMode(mode) {
      fallbackMode = mode;
      if (bioDetails) {
        bioDetails.classList.toggle("bio-condensed", mode !== "all");
      }
      updateModeButtons();
      updateStackSummary(mode);
      toggleStackList(mode);
      renderConceptBoard(mode);
      buildChips();
      var visible = visibleStacks();
      if (visible.length) {
        if (!visible.some(function(stack) { return stack.name === activeStackName; })) {
          setActiveStack(visible[0]);
        }
      } else {
        if (activeLabel) activeLabel.textContent = "";
        if (contextLabel) contextLabel.textContent = "No technologies available for this mode.";
      }
      if (fallbackStory) {
        fallbackStoryIndex = -1;
      }
    }

    function buildChips() {
      if (!stackList) return;
      var visible = visibleStacks();
      stackList.innerHTML = visible.map(function(stack) {
        return '<a class="tech_stack_chip" data-tech="' + stack.name + '" href="' + stack.url + '" target="_blank" rel="noopener noreferrer">' + stack.name + '</a>';
      }).join("");

      Array.prototype.forEach.call(stackList.querySelectorAll(".tech_stack_chip"), function(chip) {
        var name = chip.getAttribute("data-tech");
        chipByName[name] = chip;
        chip.addEventListener("mouseenter", function() {
          var stack = stacks.find(function(item) { return item.name === name; });
          if (stack) setActiveStack(stack);
        });
        chip.addEventListener("click", function(evt) {
          evt.preventDefault();
          var stack = stacks.find(function(item) { return item.name === name; });
          if (stack) {
            setActiveStack(stack);
            openEvidence(stack);
          }
        });
      });
    }

    container.innerHTML = "";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 760 760");
    svg.setAttribute("width", "760");
    svg.setAttribute("height", "760");
    svg.style.width = "100%";
    svg.style.height = "auto";
    container.appendChild(svg);

    var nodes = stacks.map(function(stack, i) {
      var y = 1 - ((i + 0.5) / Math.max(stacks.length, 1)) * 2;
      var rr = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = phi * i;
      var p = {
        x: Math.cos(theta) * rr,
        y: y,
        z: Math.sin(theta) * rr
      };

      var a = document.createElementNS(NS, "a");
      a.setAttribute("href", stack.url);
      a.setAttributeNS(XLINK, "xlink:href", stack.url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      a.addEventListener("mouseenter", function() {
        setActiveStack(stack);
        showHoverLabel(stack.name);
      });
      a.addEventListener("mouseleave", function() {
        hideHoverLabel();
      });
      a.addEventListener("click", function(evt) {
        evt.preventDefault();
        setActiveStack(stack);
        window.open(stack.url, "_blank", "noopener,noreferrer");
      });

      var img = document.createElementNS(NS, "image");
      img.setAttribute("href", stack.icon);
      img.setAttributeNS(XLINK, "xlink:href", stack.icon);
      img.setAttribute("width", String(iconBase));
      img.setAttribute("height", String(iconBase));
      img.addEventListener("error", function() {
        if (a.parentNode) a.parentNode.removeChild(a);
      });

      a.appendChild(img);
      svg.appendChild(a);
      return { p: p, a: a, img: img, stack: stack };
    });

    container.addEventListener("mousemove", function(evt) {
      var rect = container.getBoundingClientRect();
      if (!rect.width) return;
      var nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1;

      if (dragging) {
        var dx = evt.clientX - lastDragX;
        var dy = evt.clientY - lastDragY;
        lastDragX = evt.clientX;
        lastDragY = evt.clientY;

        velY = dx * 0.00155;
        velX = dy * 0.00115;
        rotY += velY;
        rotX += velX;
        rotX = Math.max(-1.15, Math.min(1.15, rotX));
        targetVelY = velY;
        targetVelX = velX;
      } else {
        targetVelY = 0.017 + nx * 0.026;
        targetVelX = ny * 0.012;
      }
    }, { passive: true });

    container.addEventListener("mousedown", function(evt) {
      dragging = true;
      lastDragX = evt.clientX;
      lastDragY = evt.clientY;
      container.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", function() {
      dragging = false;
      container.style.cursor = "grab";
    }, { passive: true });

    container.addEventListener("mouseleave", function() {
      dragging = false;
      targetVelY = 0.017;
      targetVelX = 0.0019;
      container.style.cursor = "grab";
      hideHoverLabel();
    }, { passive: true });

    modeButtons.forEach(function(btn) {
      btn.addEventListener("click", function() {
        setMode(btn.getAttribute("data-tech-mode"));
      });
    });

    if (storyToggle) {
      storyToggle.addEventListener("click", function() {
        if (fallbackStory) stopStoryMode();
        else startStoryMode();
      });
    }

    setMode("all");
    if (stacks.length) setActiveStack(stacks[0]);

    function step() {
      velY += (targetVelY - velY) * 0.16;
      velX += (targetVelX - velX) * 0.14;
      rotY += velY;
      rotX += velX;
      rotX = Math.max(-1.15, Math.min(1.15, rotX));

      var cy = Math.cos(rotY);
      var sy = Math.sin(rotY);
      var cx = Math.cos(rotX);
      var sx = Math.sin(rotX);
      var visibleIndex = 0;
      var visibleCount = Math.max(visibleStacks().length, 1);

      nodes.forEach(function(n) {
        n.a.style.display = (fallbackMode === "all" || n.stack.category === fallbackMode) ? "" : "none";
      });

      nodes.forEach(function(n) {
        if (fallbackMode !== "all" && n.stack.category !== fallbackMode) return;

        var base = n.p;
        if (fallbackMode !== "all") {
          base = spherePoint(visibleIndex, visibleCount);
        }
        var x1 = base.x * cy + base.z * sy;
        var z1 = -base.x * sy + base.z * cy;
        var y2 = base.y * cx - z1 * sx;
        var z2 = base.y * sx + z1 * cx;
        var depth = (z2 + 1) * 0.5;
        var scale = 0.55 + depth * 0.75;
        var px = center + x1 * (radius * 0.92);
        var py = center + y2 * (radius * 0.92);

        if (n.stack.name === activeStackName) {
          scale *= 1.28;
          depth = Math.max(depth, 0.95);
        }

        var sizeNow = iconBase * scale;
        px -= sizeNow / 2;
        py -= sizeNow / 2;
        n.img.setAttribute("x", String(px));
        n.img.setAttribute("y", String(py));
        n.img.setAttribute("width", String(sizeNow));
        n.img.setAttribute("height", String(sizeNow));
        n.img.setAttribute("opacity", String(Math.max(0.16, depth)));
        visibleIndex += 1;
      });

      requestAnimationFrame(step);
    }

    step();
  }

  if (!window.THREE) {
    renderSvgFallback();
    return;
  }

  var categoryMap = {
    ml: new THREE.Vector3(-95, 80, 20),
    security: new THREE.Vector3(90, 72, -35),
    cloud: new THREE.Vector3(88, -78, 32),
    java: new THREE.Vector3(0, -102, 58),
    backend: new THREE.Vector3(-84, -82, -18),
    data: new THREE.Vector3(0, 0, 92)
  };

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 1, 2000);
  camera.position.set(0, 0, 430);

  var renderer;
  var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !coarsePointer,
      alpha: true,
      powerPreference: coarsePointer ? "low-power" : "high-performance"
    });
  } catch (err) {
    renderSvgFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.25 : 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  var ambient = new THREE.AmbientLight(0xffffff, 0.95);
  var key = new THREE.PointLight(0x8be9ff, 0.85, 1000);
  key.position.set(120, 130, 260);
  var rim = new THREE.PointLight(0xffc26b, 0.65, 1000);
  rim.position.set(-170, -80, 180);
  scene.add(ambient, key, rim);

  var cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2(-2, -2);
  var pointerWorld = new THREE.Vector3();
  var tempV = new THREE.Vector3();
  var clock = new THREE.Clock();

  var nodes = [];
  var chipByName = Object.create(null);
  var currentMode = "all";
  var bioDetails = document.querySelector("#about .person_details");
  var hoveredNode = null;
  var pointerInside = false;
  var activeNode = null;
  var pausedByHover = false;
  var isStoryMode = false;
  var storyTimer = null;
  var storyIndex = 0;

  var mediaCompact = window.matchMedia("(max-width: 991px)").matches;
  var damping = mediaCompact ? 0.83 : 0.88;
  var spring = mediaCompact ? 0.055 : 0.065;

  var baseRotX = coarsePointer ? 0.0014 : 0.0062;
  var baseRotY = coarsePointer ? -0.0066 : -0.0188;
  var rotVelX = baseRotX;
  var rotVelY = baseRotY;
  var targetRotX = rotVelX;
  var targetRotY = rotVelY;
  var isDragging = false;
  var lastDragX = 0;
  var lastDragY = 0;

  function setSize() {
    var size = Math.min(container.clientWidth || 540, 760);
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  function fibonacciPoint(i, n) {
    var phi = Math.PI * (3 - Math.sqrt(5));
    var y = 1 - ((i + 0.5) / Math.max(n, 1)) * 2;
    var r = Math.sqrt(1 - y * y);
    var theta = phi * i;
    return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
  }

  function makeTrail() {
    var points = [];
    for (var i = 0; i < 8; i += 1) points.push(new THREE.Vector3());
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.18 });
    var line = new THREE.Line(geo, mat);
    line.renderOrder = 1;
    return { line: line, points: points };
  }

  function buildChips() {
    if (!stackList) return;
    var visible = stacks.filter(function(stack) {
      return currentMode === "all" || stack.category === currentMode;
    });
    stackList.innerHTML = visible.map(function(stack) {
      return '<a class="tech_stack_chip" data-tech="' + stack.name + '" href="' + stack.url + '" target="_blank" rel="noopener noreferrer">' + stack.name + '</a>';
    }).join("");

    Array.prototype.forEach.call(stackList.querySelectorAll(".tech_stack_chip"), function(chip) {
      var name = chip.getAttribute("data-tech");
      chipByName[name] = chip;
      chip.addEventListener("mouseenter", function() {
        var node = nodes.find(function(n) { return n.stack.name === name; });
        if (node) setActive(node, "chip-hover");
      });
      chip.addEventListener("click", function(evt) {
        evt.preventDefault();
        var node = nodes.find(function(n) { return n.stack.name === name; });
        if (node) {
          setActive(node, "chip-click");
          openEvidence(node.stack);
        }
      });
    });
  }

  function setActive(node, reason) {
    activeNode = node;
    if (activeLabel) activeLabel.textContent = node.stack.name;
    if (contextLabel) contextLabel.textContent = node.stack.context;
    if (stackSummary) stackSummary.setAttribute("data-active", node.stack.name);

    Object.keys(chipByName).forEach(function(name) {
      chipByName[name].classList.toggle("is-active", name === node.stack.name);
    });

    node.pulse = reason === "story" ? 1.2 : 0.75;
  }

  function openEvidence(stack) {
    window.open(stack.url, "_blank", "noopener,noreferrer");
  }

  function assignTargets(mode) {
    currentMode = mode;
    if (bioDetails) {
      bioDetails.classList.toggle("bio-condensed", mode !== "all");
    }
    updateStackSummary(mode);
    toggleStackList(mode);
    renderConceptBoard(mode);
    buildChips();

    modeButtons.forEach(function(btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tech-mode") === mode);
    });

    var filtered = stacks.filter(function(s) { return mode === "all" || s.category === mode; });
    var idx = 0;

    nodes.forEach(function(node) {
      if (node.removed) return;

      if (mode === "all") {
        node.target.copy(node.base.clone().multiplyScalar(225));
        node.targetOpacity = 1;
        idx += 1;
      } else if (node.stack.category === mode) {
        var p = fibonacciPoint(idx, Math.max(filtered.length, 2)).multiplyScalar(225);
        node.target.copy(p);
        node.targetOpacity = 1;
        idx += 1;
      } else {
        var pushed = node.base.clone().multiplyScalar(320);
        node.target.copy(pushed);
        node.targetOpacity = 0.14;
      }
    });
  }

  function startStoryMode() {
    if (storyTimer) window.clearInterval(storyTimer);
    isStoryMode = true;
    if (storyToggle) {
      storyToggle.classList.add("is-active");
      storyToggle.textContent = "Stop Story Mode";
      storyToggle.setAttribute("aria-pressed", "true");
    }

    function step() {
      var visibleNodes = nodes.filter(function(n) {
        return !n.removed && (currentMode === "all" || n.stack.category === currentMode);
      });
      if (!visibleNodes.length) return;
      storyIndex = (storyIndex + 1) % visibleNodes.length;
      setActive(visibleNodes[storyIndex], "story");
    }

    step();
    storyTimer = window.setInterval(step, 2800);
  }

  function stopStoryMode() {
    isStoryMode = false;
    if (storyTimer) window.clearInterval(storyTimer);
    storyTimer = null;
    if (storyToggle) {
      storyToggle.classList.remove("is-active");
      storyToggle.textContent = "Start Story Mode";
      storyToggle.setAttribute("aria-pressed", "false");
    }
  }

  function buildCloud() {
    var loader = new THREE.TextureLoader();

    stacks.forEach(function(stack, i) {
      var tex = loader.load(stack.icon, undefined, undefined, function() {
        node.removed = true;
        node.sprite.visible = false;
        node.trail.line.visible = false;
        if (chipByName[stack.name] && chipByName[stack.name].parentNode) {
          chipByName[stack.name].parentNode.removeChild(chipByName[stack.name]);
        }
      });

      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;

      var material = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 });
      var sprite = new THREE.Sprite(material);
      sprite.scale.setScalar(34);
      sprite.renderOrder = 2;
      cloudGroup.add(sprite);

      var base = fibonacciPoint(i, stacks.length);
      var trail = makeTrail();
      cloudGroup.add(trail.line);

      var node = {
        stack: stack,
        sprite: sprite,
        base: base,
        pos: base.clone().multiplyScalar(225),
        vel: new THREE.Vector3(),
        target: base.clone().multiplyScalar(225),
        targetOpacity: 1,
        trail: trail,
        removed: false,
        pulse: 0
      };

      sprite.userData.node = node;
      nodes.push(node);
    });
  }

  function updatePointerWorld() {
    raycaster.setFromCamera(pointer, camera);
    var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.ray.intersectPlane(plane, pointerWorld);
  }

  function onPointerMove(evt) {
    pointerInside = true;
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

    updatePointerWorld();

    if (isDragging) {
      var dx = evt.clientX - lastDragX;
      var dy = evt.clientY - lastDragY;
      lastDragX = evt.clientX;
      lastDragY = evt.clientY;

      var dragScaleY = coarsePointer ? 0.00085 : 0.0017;
      var dragScaleX = coarsePointer ? 0.00065 : 0.0012;
      rotVelY = dx * dragScaleY;
      rotVelX = dy * dragScaleX;
      cloudGroup.rotation.y += rotVelY;
      cloudGroup.rotation.x += rotVelX;
      cloudGroup.rotation.x = Math.max(-1.2, Math.min(1.2, cloudGroup.rotation.x));
      targetRotY = rotVelY;
      targetRotX = rotVelX;
    } else {
      var pointerScaleY = coarsePointer ? 0.0068 : 0.019;
      var pointerScaleX = coarsePointer ? 0.0054 : 0.015;
      targetRotY = pointer.x * pointerScaleY;
      targetRotX = pointer.y * pointerScaleX;
    }
  }

  function onPointerLeave() {
    pointerInside = false;
    pointer.set(-2, -2);
    pausedByHover = false;
    hoveredNode = null;
    hideHoverLabel();
    isDragging = false;
    renderer.domElement.style.cursor = "grab";
    targetRotX = baseRotX;
    targetRotY = baseRotY;
  }

  function pickNodeFromEvent(evt) {
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(
      nodes.filter(function(n) { return !n.removed; }).map(function(n) { return n.sprite; }),
      false
    );
    return hits.length ? hits[0].object.userData.node : null;
  }

  function bindInteractions() {
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("mouseenter", function() {
      pointerInside = true;
    }, { passive: true });

    renderer.domElement.style.cursor = "grab";

    renderer.domElement.addEventListener("pointerdown", function(evt) {
      isDragging = true;
      lastDragX = evt.clientX;
      lastDragY = evt.clientY;
      if (renderer.domElement.setPointerCapture && typeof evt.pointerId === "number") {
        renderer.domElement.setPointerCapture(evt.pointerId);
      }
      renderer.domElement.style.cursor = "grabbing";
      if (evt.pointerType === "touch") evt.preventDefault();
    });

    window.addEventListener("pointerup", function(evt) {
      isDragging = false;
      if (renderer.domElement.releasePointerCapture && typeof evt.pointerId === "number") {
        try {
          renderer.domElement.releasePointerCapture(evt.pointerId);
        } catch (_e) {
          // Ignore capture release errors.
        }
      }
      if (coarsePointer) {
        // On touch devices, settle to near-still state after interaction.
        targetRotX = 0;
        targetRotY = 0;
      }
      renderer.domElement.style.cursor = "grab";
    }, { passive: true });

    window.addEventListener("pointercancel", function() {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    }, { passive: true });

    renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
    renderer.domElement.addEventListener("pointerleave", onPointerLeave, { passive: true });

    renderer.domElement.addEventListener("click", function(evt) {
      var clickedNode = pickNodeFromEvent(evt) || hoveredNode;
      if (clickedNode) {
        setActive(clickedNode, "click");
        openEvidence(clickedNode.stack);
      }
    });

    modeButtons.forEach(function(btn) {
      btn.addEventListener("click", function() {
        assignTargets(btn.getAttribute("data-tech-mode"));
      });
    });

    if (storyToggle) {
      storyToggle.addEventListener("click", function() {
        if (isStoryMode) stopStoryMode();
        else startStoryMode();
      });
    }
  }

  function animate() {
    var dt = Math.min(clock.getDelta(), 0.032);

    raycaster.setFromCamera(pointer, camera);
    var intersects = raycaster.intersectObjects(nodes.filter(function(n) { return !n.removed; }).map(function(n) { return n.sprite; }), false);
    hoveredNode = intersects.length ? intersects[0].object.userData.node : null;
    pausedByHover = false;

    if (hoveredNode) {
      setActive(hoveredNode, "hover");
      showHoverLabel(hoveredNode.stack.name);
    } else {
      hideHoverLabel();
    }

    if (!pausedByHover) {
      rotVelX += (targetRotX - rotVelX) * 0.16;
      rotVelY += (targetRotY - rotVelY) * 0.16;
      cloudGroup.rotation.x += rotVelX;
      cloudGroup.rotation.y += rotVelY;
      cloudGroup.rotation.x = Math.max(-1.2, Math.min(1.2, cloudGroup.rotation.x));
    }

    nodes.forEach(function(node) {
      if (node.removed) return;

      if (!pausedByHover) {
        tempV.copy(pointerWorld).sub(node.pos);
        var m = tempV.length();
        if (m < 140) {
          tempV.normalize().multiplyScalar((140 - m) * 0.0008);
          node.vel.add(tempV);
        }
      }

      tempV.copy(node.target).sub(node.pos).multiplyScalar(spring);
      node.vel.add(tempV);
      node.vel.multiplyScalar(damping);
      node.pos.add(node.vel);

      node.sprite.position.copy(node.pos);
      var depthNorm = (node.pos.z + 225) / 450;
      var scale = 22 + Math.max(0.05, Math.min(1.4, depthNorm)) * 27;
      if (node === activeNode) {
        node.pulse = Math.max(0, node.pulse - dt * 0.9);
      }
      var pulseMul = node === activeNode ? 1.18 + Math.sin(performance.now() * 0.009) * 0.06 + node.pulse * 0.12 : (hoveredNode ? 0.88 : 1);
      node.sprite.scale.set(scale * pulseMul, scale * pulseMul, 1);
      var visualOpacityTarget = node.targetOpacity;
      if (hoveredNode && node !== activeNode && node.targetOpacity > 0.2) {
        visualOpacityTarget = Math.min(visualOpacityTarget, 0.48);
      }
      node.sprite.material.opacity += (visualOpacityTarget - node.sprite.material.opacity) * 0.12;

      node.trail.points.pop();
      node.trail.points.unshift(node.pos.clone());
      node.trail.line.geometry.setFromPoints(node.trail.points);
      node.trail.line.material.opacity = node.sprite.material.opacity * 0.22;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", setSize, { passive: true });

  renderConceptBoard("all");
  buildCloud();
  bindInteractions();
  assignTargets("all");
  setSize();

  if (nodes.length) {
    setActive(nodes[0], "init");
  }

  animate();
})();
