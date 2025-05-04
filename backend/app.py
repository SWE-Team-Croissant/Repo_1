from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models.models import db, User, VitalRecord, SymptomRecord, Alert
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv
from controllers.provider import provider_bp


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///dysautonomia.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
# here is problem like why? 
#app.register_blueprint(provider_bp, url_prefix='/api/health')
# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app)
app.register_blueprint(provider_bp, url_prefix='/api/health')

# Create tables
with app.app_context():
    db.create_all()

# Import and register blueprints
from controllers.auth import auth_bp
from controllers.vitals import vitals_bp
from controllers.symptoms import symptoms_bp
from controllers.alerts import alerts_bp
from controllers.health_summary import summary_bp
from controllers.provider import provider_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(vitals_bp, url_prefix='/api/vitals')
app.register_blueprint(symptoms_bp, url_prefix='/api/symptoms')
app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
app.register_blueprint(summary_bp, url_prefix='/api/health')
# this crashes everything 
#app.register_blueprint(provider_bp, url_prefix='/api/provider')


@app.route('/')
def home():
    return jsonify({"message": "Dysautonomia Monitoring System API"})

if __name__ == '__main__':
    app.run(debug=True)
