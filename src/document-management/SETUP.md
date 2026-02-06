# Document Management System Setup Guide

This guide will help you set up the Document Management System (DMS) for JuristDZ.

## Prerequisites

1. **Node.js 18+** installed
2. **Supabase account** with a project created
3. **Environment variables** configured

## Environment Variables

Create or update your `.env.local` file with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase dashboard under Settings > API.

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Schema Setup

The DMS requires specific database tables and configurations. You have two options:

#### Option A: Automatic Setup (Recommended)

Run the setup script:

```bash
npm run setup:dms
```

This will:
- Validate your configuration
- Test the Supabase connection
- Check initialization status
- Provide instructions for manual schema setup if needed

#### Option B: Manual Setup

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Execute the SQL file: `database/document-management-complete-schema.sql`
4. Run the setup script to verify: `npm run setup:dms`

### 3. Create Sample Data (Optional)

To create sample data for testing:

```bash
npm run setup:dms:sample
```

This will create:
- Sample encryption keys
- Sample folders
- Sample templates
- Sample audit trail entries

## Verification

After setup, verify everything is working:

1. **Check Database Tables**: Ensure all required tables exist
2. **Test Storage Bucket**: Verify the 'documents' bucket is created
3. **Test Authentication**: Make sure RLS policies are working
4. **Run Tests**: Execute the test suite

```bash
npm test
```

## Configuration Options

The DMS can be configured through `src/document-management/config/index.ts`:

### File Upload Settings
- **Max File Size**: 50MB (configurable)
- **Allowed Types**: PDF, DOC, DOCX, JPG, PNG, TXT
- **MIME Types**: Automatically validated

### Security Settings
- **Encryption**: AES-256 for all documents
- **RLS**: Row Level Security enabled by default
- **MFA**: Multi-factor authentication for sensitive documents
- **Audit Trail**: Complete activity logging

### Folder Settings
- **Max Depth**: 5 levels (as per requirements)
- **Hierarchy**: Automatic path generation

## Database Schema Overview

The DMS creates the following main tables:

### Core Tables
- `documents` - Document metadata and references
- `document_versions` - Version control for documents
- `folders` - Folder hierarchy and organization
- `templates` - Document templates by role

### Security Tables
- `encryption_keys` - Document encryption keys
- `document_permissions` - Granular access control
- `share_links` - Secure external sharing
- `audit_trail` - Complete activity logging

### Workflow Tables
- `signature_workflows` - Digital signature processes
- `workflow_signers` - Signature participants
- `document_workflows` - Approval workflows
- `workflow_steps` - Workflow step definitions

### Utility Tables
- `document_comments` - Document annotations
- `document_statistics` - Usage statistics view
- `folder_hierarchy` - Recursive folder view

## Storage Configuration

The system uses Supabase Storage with:

- **Bucket Name**: `documents`
- **Privacy**: Private (not publicly accessible)
- **File Size Limit**: 50MB
- **Allowed MIME Types**: PDF, Word, Images, Text
- **Path Structure**: `{user_id}/{filename}`

## Row Level Security (RLS)

All tables have RLS enabled with policies for:

- **User Isolation**: Users can only access their own data
- **Permission-Based Access**: Granular document permissions
- **Role-Based Templates**: Templates filtered by user role
- **Audit Trail Security**: Users see only their own activities

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your Supabase URL and keys
   - Verify network connectivity
   - Ensure Supabase project is active

2. **Schema Creation Failed**
   - Check database permissions
   - Verify SQL syntax in schema file
   - Try manual execution in Supabase dashboard

3. **Storage Bucket Issues**
   - Check storage permissions in Supabase
   - Verify bucket policies are applied
   - Ensure file size limits are configured

4. **RLS Policy Errors**
   - Check user authentication
   - Verify policy syntax
   - Test with authenticated user

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will provide detailed logs for:
- Database operations
- File uploads
- Authentication checks
- RLS policy evaluations

## Performance Considerations

### Database Indexes

The schema includes optimized indexes for:
- Document searches by case, folder, tags
- Version history queries
- Audit trail lookups
- Permission checks

### Connection Pooling

Configure connection pooling in production:
- Pool size: 10 connections (default)
- Query timeout: 30 seconds
- Retry logic for failed connections

### File Storage

Optimize file storage:
- Use signed URLs for secure access
- Implement client-side compression
- Consider CDN for frequently accessed files

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use different keys for development/production
   - Rotate keys regularly

2. **File Validation**
   - Always validate file types and sizes
   - Scan for malware before storage
   - Sanitize file names

3. **Access Control**
   - Implement least privilege principle
   - Regular permission audits
   - Monitor access patterns

4. **Encryption**
   - All documents encrypted at rest
   - Secure key management
   - Regular key rotation

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the system logs
3. Consult the main documentation
4. Contact the development team

## Next Steps

After successful setup:

1. **Implement Document Upload**: Start with task 3.1
2. **Add File Validation**: Implement security checks
3. **Create User Interface**: Build React components
4. **Add Search Functionality**: Implement full-text search
5. **Test Workflows**: Verify signature and approval flows

The Document Management System is now ready for development and testing!