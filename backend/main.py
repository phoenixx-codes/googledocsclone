from fastapi import FastAPI,WebSocket,WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict,List


app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#in-memory document storage
documents:Dict[str,dict]={}

#active websockets connections per document
connections:Dict[str,List[WebSocket]]={}



@app.get("/")
def health():
    return {"status":"ok"}

documents={}

@app.get("/documents/{doc_id}")
def get_document(doc_id:str):
    return documents.get(doc_id,{"content":None})

@app.post("/documents/{doc_id}")
def save_document(doc_id:str,payload:dict):
    documents[doc_id]=payload
    return {"saved":True}

@app.websocket("/ws/{doc_id}")
async def websocket_endpoint(ws: WebSocket,doc_id:str):
    await ws.accept()

    if doc_id not in connections:
        connections[doc_id]=[]

    connections[doc_id].append(ws)

    try:
        while True:
            data=await ws.receive_json()

            #save latest document data
            documents[doc_id]=data

            for conn in connections[doc_id]:
                if conn!=ws:
                    await conn.send_json(data)

    except WebSocketDisconnect:
        connections[doc_id].remove(ws)

        