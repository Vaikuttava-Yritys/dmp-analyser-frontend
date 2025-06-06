# DMP Analyser

DMP Analyser is a specialized web application designed to analyze Data Management Plans (DMPs) using Large Language Models (LLMs). Thecurrent early version evaluates text against a checklist of best practices and provides detailed feedback on how to improve the DMP.

## Features

- **Customizable Assessment Framework**: Adaptable to various evaluation criteria and standards
- **AI-Powered Analysis**: Uses LLMs to analyze DMP content
- **Detailed Scoring & Insights**: Provides clear feedback with actionable recommendations
- **PDF Export**: Download and share analysis results in PDF format
- **Shareable Results**: Generate links to share results with colleagues
- **Built-In Data Privacy & Security**: Ensures sensitive research information remains protected

## Project Structure

```
dmp/
├── index.html          # Main application page
├── about.html          # About page with project information
├── feedback.html       # User feedback submission form
├── feedback_view.html  # View for displaying feedback results
├── export.html         # PDF export functionality
├── privacy.html        # Privacy policy page
├── app.js              # Main JavaScript application logic
├── pdf-export.js       # PDF export functionality
├── style.css           # Main stylesheet
├── components/         # Reusable HTML components
├── css/                # Additional CSS files
├── js/                 # Additional JavaScript files
└── img/                # Image assets
```

## How It Works

The DMP Analyser uses a modular pipeline architecture that processes text through several specialized components:

1. **Metadata Extractor**: Identifies metadata from text (title, discipline, study type)
2. **Domain Evaluator**: Analyzes text against specific domains of DMP best practices
3. **Item Evaluator**: Evaluates individual checklist items
4. **Domain Reconciler**: Harmonizes evaluations across domains and their items
5. **Domain Summarizer**: Creates concise summaries of each domain's evaluation
6. **Feedback Note**: Generates actionable recommendations for the author

## Deployment

The DMP Analyser frontend can be deployed to any static hosting provider. The application connects to a backend API for processing.

### Configuration

- The application uses the following configuration in `app.js`:
  - `API_BASE` - The base URL of the backend API (default: Azure deployment URL)
  - Additional configuration parameters for analysis types and checklists

## Usage

1. Open the application in a web browser
2. Paste your DMP text into the input field
3. Select the appropriate checklist and configuration
4. Submit for analysis
5. View the detailed feedback and recommendations
6. Export results as PDF or share via a unique link

## Team

- **Juuso Repo**, juuso.repo@utu.fi, INVEST Research Flagship Centre, University of Turku
- **Johanna Laiho-Kauranne**, CSC IT Centre for Science
- **Jukka Rantasaari**, University of Turku

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

---

For more information about the ReproAI project and related tools, see the main ReproAI documentation.
