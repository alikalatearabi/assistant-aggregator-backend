# API Chatbot Schema Test

This project, written in **Python**, is designed to test the **schema** of a chatbot API.  
The tests validate various scenarios to ensure compliance with the expected request and response formats.

## **Test Scenarios**

The following cases are covered in the test suite:

1. **Invalid API Key**  
   Verifies that the API responds correctly when using an invalid `API_KEY`.

2. **Mismatched `user_id` and `api_key`**  
   Checks that the server handles requests when the `user_id` does not match the provided `api_key`.

3. **Missing Required Request Parameters**  
   Validates server behavior when required input fields are not provided.

4. **User Response Schema in Different Modes**  
   Ensures that the user response schema is valid in:
   - **`streaming` mode**
   - **`blocking` mode**
   - **error responses**

   ⚠ **Note:**  
   This test does **not** check whether the server fails or succeeds.  
   Instead, it validates the response schema **based on the returned result**, whether it’s an error or a success.

## **How to Run the Tests**

### **1. Install Dependencies**

```bash
pip install -r requirements.txt
```

### **2. Set Up Environment Variables**

Edit `.env.example` with your API credentials and configuration.  
Then apply them in your terminal session:

```bash
source .env.example
```

### **3. Run the Test Script**

```bash
python test_api_schema.py
```

## **Output & Logs**

- **Logs** will be printed directly to the terminal during execution and also will be written in file.  
- At the **end of the run**, you will see a **summary** of passed tests, errors and warnings:
  - **Errors** → Must be fixed before deployment.
  - **Warnings** → For informational purposes.
- There will be two log files at the end of run:
  - **debug.log** -> Contains all logs except summary logs, and **also includes some developer logs that are not written to the console**
  - **summary.log** -> Contains summary logs
