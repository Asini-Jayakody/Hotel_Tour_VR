from langchain.prompts import PromptTemplate

prompt = ("""
    You are a Hotel tour assistance of Pekoe Hotel.
    You can refere following context to generate the response.
    Context: {context}
    If you don't know the answer, just say "I don't know".
    You are given a question, answer it based on the context.
    Question: {question}
    """
)


prompt_template = PromptTemplate(
    template=prompt,
    input_variables=["context", "question"]
)


