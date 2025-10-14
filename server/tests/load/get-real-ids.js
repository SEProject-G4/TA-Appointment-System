// get-real-ids.js - Helper script to get real IDs from database
const mongoose = require('mongoose');
const ModuleDetails = require('../src/models/ModuleDetails');
const TaApplication = require('../src/models/TaApplication');
const User = require('../src/models/User');

async function getRealIds() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ta-appointment-system');
        console.log('🔗 Connected to database');
        
        console.log('\n📚 === REAL MODULE IDS ===');
        const modules = await ModuleDetails.find().limit(5).select('_id moduleCode moduleName coordinator');
        modules.forEach((module, index) => {
            console.log(`${index + 1}. ID: ${module._id}`);
            console.log(`   Code: ${module.moduleCode}`);
            console.log(`   Name: ${module.moduleName}`);
            console.log(`   Coordinator: ${module.coordinator}`);
            console.log('');
        });

        console.log('📝 === REAL APPLICATION IDS ===');
        const applications = await TaApplication.find().limit(5).select('_id moduleId applicantId status');
        applications.forEach((app, index) => {
            console.log(`${index + 1}. ID: ${app._id}`);
            console.log(`   Module: ${app.moduleId}`);
            console.log(`   Applicant: ${app.applicantId}`);
            console.log(`   Status: ${app.status}`);
            console.log('');
        });

        console.log('👥 === REAL USER IDS (LECTURERS) ===');
        const lecturers = await User.find({ role: 'lecturer' }).limit(5).select('_id name email googleId');
        lecturers.forEach((lecturer, index) => {
            console.log(`${index + 1}. ID: ${lecturer._id}`);
            console.log(`   Name: ${lecturer.name}`);
            console.log(`   Email: ${lecturer.email}`);
            console.log(`   GoogleID: ${lecturer.googleId}`);
            console.log('');
        });

        console.log('🎯 === COPY THESE IDS TO YOUR artillery-lecturer.yml ===');
        console.log('Variables to update:');
        if (modules.length > 0) {
            console.log(`realModuleId: "${modules[0]._id}"`);
        }
        if (applications.length > 0) {
            console.log(`realApplicationId: "${applications[0]._id}"`);
        }
        if (lecturers.length > 0) {
            console.log(`realUserId: "${lecturers[0]._id}"`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.disconnect();
        console.log('\n✅ Database disconnected');
    }
}

// Run the script
getRealIds();