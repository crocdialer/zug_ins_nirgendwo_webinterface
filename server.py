#!/usr/bin/env python
'''
kinski_remote
Created on August 20, 2014
@author: crocdialer@googlemail.com 
'''

import os, datetime, socket, sqlite3

from bottle import route, run, template, view, response, Bottle
from bottle import get, post, request
from bottle import static_file

# our Bottle app instance
app = Bottle()

TCP_IP = '127.0.0.1'
TCP_PORT = 33333
BUFFER_SIZE = 16384

# 2 MB
IMG_BUFFER_SIZE = 2097152

@app.get('/') 
@app.get('/view') # or @route('/view')
@view('index')
def index_view():
    return dict()

@app.get('/state') 
def get_state():
    data = ""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TCP_IP, TCP_PORT))
        s.send("request_state")
        data = s.recv(BUFFER_SIZE)
        s.close()
    except:
        print("socket error")

    return data

@app.post('/state') 
def set_state():
    data = request.body.read()
    #print request.json
    print data 
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TCP_IP, TCP_PORT))
        s.send(data)
        s.close()
    except:
        print("socket error")

    return "poop"

@app.get('/save') 
def save_settings():
    data = ""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TCP_IP, TCP_PORT))
        s.send("save_settings")
        data = s.recv(BUFFER_SIZE)
        s.close()
    except:
        print("socket error")

    return data

@app.get('/load') 
def load_settings():
    data = ""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TCP_IP, TCP_PORT))
        s.send("load_settings")
        data = s.recv(BUFFER_SIZE)
        s.close()
    except:
        print("socket error")

    return data

@app.get('/snapshot') 
def generate_snapshot():
    data = ""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((TCP_IP, TCP_PORT))
        s.send("generate_snapshot")
        data = s.recv(IMG_BUFFER_SIZE)
        s.close()
    except:
        print("socket error")
    
    response.set_header('Content-Type', "image/jpeg")
    response.set_header("Content-Length", len(data))

    return data

# Static Routes
@app.get('/static/img/<filename:re:.*\.(jpg|jpeg|png|JPG|JPEG|PNG|svg|gif)>')
def internal_images(filename):
  return static_file(filename, root='static/img')

@app.get('/static/js/<filename:re:.*\.js>')
def javascripts(filename):
    return static_file(filename, root='static/js')

@app.get('/static/css/<filename:re:.*\.css>')
def stylesheets(filename):
    return static_file(filename, root='static/css')

@app.get('/static/fonts/<filename:re:.*\.(eot|ttf|woff|svg)>')
def fonts(filename):
    return static_file(filename, root='static/fonts')

# standalone server
if __name__ == '__main__':
  # start server
  run(app, host='0.0.0.0', port=8080, debug=True, reloader=True)
