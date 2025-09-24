// src/create-new-templates.ts
import { PrismaClient } from '@prisma/client';

async function createNewTemplates() {
  console.log('🚀 Creating Candidate & Interview Templates...\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    const newTemplates = [
      // Candidate Shortlisted Template
      {
        id: 'template-candidate-shortlisted',
        name: 'candidate-shortlisted',
        type: 'email',
        subject: 'Congratulations! You have been shortlisted - {{full_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! You've Been Shortlisted</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #28a745;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin: 0;
      font-size: 28px;
    }
    .details-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #28a745;
    }
    .detail-row {
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    .detail-label {
      font-weight: 600;
      color: #495057;
      min-width: 140px;
    }
    .detail-value {
      color: #212529;
      flex: 1;
      margin-left: 10px;
    }
    .score-highlight {
      background: #28a745;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
    }
    .next-steps {
      background: #e7f3ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      h1 { font-size: 24px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-label { min-width: auto; margin-bottom: 5px; }
      .detail-value { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">🎉</div>
      <h1>Congratulations!</h1>
      <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">You've Been Shortlisted</p>
    </div>

    <div class="content">
      <p>Dear <strong>{{full_name}}</strong>,</p>
      
      <p>We are excited to inform you that your application has been successfully shortlisted for the position! Based on our initial screening process, your profile shows great potential for this role.</p>

      <div class="details-box">
        <h3 style="margin-top: 0; color: #28a745;">📋 Application Details</h3>
        
        <div class="detail-row">
          <span class="detail-label">Application ID:</span>
          <span class="detail-value"><code>{{application_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Job Requisition:</span>
          <span class="detail-value"><code>{{job_requisition_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Current Status:</span>
          <span class="detail-value"><strong style="color: #28a745; text-transform: capitalize;">{{status}}</strong></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Screening Score:</span>
          <span class="detail-value"><span class="score-highlight">{{score}}/100</span></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Document Reviewed:</span>
          <span class="detail-value" style="text-transform: capitalize;">{{document_type}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Screening Status:</span>
          <span class="detail-value" style="text-transform: capitalize;">{{screening_status}}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3 style="margin-top: 0; color: #007bff;">🚀 What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Our HR team will contact you within the next 2-3 business days</li>
          <li>Be prepared to discuss your experience and qualifications in detail</li>
          <li>Keep an eye on your email for interview scheduling information</li>
          <li>Feel free to research our company culture and values</li>
        </ul>
      </div>

      <p>We look forward to learning more about you and how you can contribute to our team. Thank you for your interest in joining our organization!</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>{{company_name}} Recruitment Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated message regarding your job application.</p>
      <p>If you have any questions, please contact our HR department.</p>
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },

      // Interview Scheduled Template
      {
        id: 'template-interview-scheduled',
        name: 'interview-scheduled',
        type: 'email',
        subject: 'Interview Scheduled - {{full_name}} | {{job_requisition_id}}',
        body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled - Please Confirm</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }
    .calendar-icon {
      font-size: 48px;
      color: #007bff;
      margin-bottom: 10px;
    }
    h1 {
      color: #007bff;
      margin: 0;
      font-size: 28px;
    }
    .interview-details {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      margin: 25px 0;
      text-align: center;
    }
    .interview-time {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .meeting-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #007bff;
    }
    .meeting-link {
      background: #007bff;
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin: 10px 0;
      font-weight: bold;
    }
    .meeting-link:hover {
      background: #0056b3;
      color: white;
    }
    .important-note {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 5px;
      border-left: 3px solid #f1c40f;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
    .detail-row {
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    .detail-label {
      font-weight: 600;
      color: #495057;
      min-width: 120px;
    }
    .detail-value {
      color: #212529;
      flex: 1;
      margin-left: 10px;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      h1 { font-size: 24px; }
      .interview-time { font-size: 20px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-label { min-width: auto; margin-bottom: 5px; }
      .detail-value { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="calendar-icon">📅</div>
      <h1>Interview Scheduled</h1>
      <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">Please confirm your attendance</p>
    </div>

    <div class="content">
      <p>Dear <strong>{{full_name}}</strong>,</p>
      
      <p>We are pleased to inform you that your interview has been scheduled for the position. Please find the details below:</p>

      <div class="interview-details">
        <h3 style="margin-top: 0;">📋 Interview Information</h3>
        <div class="interview-time">{{interview_start_date_time}}</div>
        <p>Duration: {{interview_start_date_time}} - {{interview_end_date_time}}</p>
        <p><strong>Timezone:</strong> {{timezone}}</p>
      </div>

      <div class="meeting-info">
        <h4 style="margin-top: 0; color: #007bff;">🎯 Meeting Details</h4>
        
        <div class="detail-row">
          <span class="detail-label">Application ID:</span>
          <span class="detail-value"><code>{{application_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Schedule ID:</span>
          <span class="detail-value"><code>{{schedule_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Job Requisition:</span>
          <span class="detail-value"><code>{{job_requisition_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value"><strong style="color: #007bff; text-transform: capitalize;">{{status}}</strong></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Meeting Mode:</span>
          <span class="detail-value" style="text-transform: capitalize;"><strong>{{meeting_mode}}</strong></span>
        </div>

        {{#if meeting_link}}
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>Join the interview:</strong></p>
          <a href="{{meeting_link}}" class="meeting-link">Join Virtual Meeting</a>
        </div>
        {{/if}}

        {{#if interview_address}}
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">{{interview_address}}</span>
        </div>
        {{/if}}
      </div>

      {{#if message}}
      <div class="important-note">
        <h4 style="margin-top: 0; color: #856404;">📝 Additional Message</h4>
        <p style="margin-bottom: 0;">{{message}}</p>
      </div>
      {{/if}}

      <div class="important-note">
        <h4 style="margin-top: 0; color: #856404;">⚠️ Important Reminders</h4>
        <ul style="margin-bottom: 0; padding-left: 20px;">
          <li>Please confirm your attendance by replying to this email</li>
          {{#ifCond meeting_mode '==' 'virtual'}}
          <li>Join the meeting 5-10 minutes early to test your connection</li>
          <li>Ensure you have a stable internet connection and working camera/microphone</li>
          {{else}}
          <li>Please arrive 15 minutes early to allow time for check-in</li>
          <li>Bring a valid form of identification</li>
          {{/ifCond}}
          <li>Prepare questions about the role and our company</li>
          <li>Have copies of your resume and any relevant documents ready</li>
        </ul>
      </div>

      <p>We look forward to meeting with you and learning more about your qualifications. If you need to reschedule or have any questions, please contact our HR team as soon as possible.</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>{{company_name}} HR Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated interview scheduling notification.</p>
      <p>Please reply to confirm your attendance or contact HR if you need to reschedule.</p>
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
    ];

    // Create the templates
    for (const templateData of newTemplates) {
      const template = await prisma.template.upsert({
        where: { id: templateData.id },
        update: {},
        create: templateData,
      });
      console.log(`   ✅ Created template: ${template.name}`);
    }

    console.log(`\n🎉 Created ${newTemplates.length} new templates successfully!`);
    console.log('\n📧 Templates created:');
    console.log('   • candidate-shortlisted');
    console.log('   • interview-scheduled');

  } catch (error) {
    console.error('❌ Template creation failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 New templates ready! You can now test the candidate and interview events!');
  }
}

createNewTemplates();