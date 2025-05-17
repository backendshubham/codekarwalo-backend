const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const uploadToS3 = async (file, folder, customName) => {
    try {
        // Validate required environment variables
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_BUCKET_NAME) {
            throw new Error('Missing required AWS configuration');
        }

        // Create filename: fullname_resume_timestamp.pdf
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const formattedName = `${customName}_resume_${timestamp}.${fileExtension}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${folder}/${formattedName}`,
            Body: file.data,
            ContentType: file.mimetype,
            ServerSideEncryption: 'AES256' // Enable server-side encryption
        };

        // Check if bucket exists and is accessible
        try {
            await s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise();
        } catch (error) {
            console.error('Bucket access error:', error);
            throw new Error('Unable to access S3 bucket. Please check bucket permissions and configuration.');
        }

        // Upload file
        const result = await s3.upload(params).promise();
        console.log('File uploaded successfully:', result.Location);
        return result.Location;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        if (error.code === 'AccessDenied') {
            throw new Error('Access denied to S3 bucket. Please check AWS credentials and bucket permissions.');
        }
        throw error;
    }
};

module.exports = {
    uploadToS3
}; 