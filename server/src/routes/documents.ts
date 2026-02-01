import express from 'express';
import multer from 'multer';
import { documentService } from '@/services/documentService';
import { fileStorageService } from '@/services/fileStorageService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import {
  DocumentGenerationRequest,
  DocumentSearchCriteria,
  DocumentExportOptions,
  BulkDocumentOperation,
  DocumentAction
} from '@/types/document';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * Generate document from template
 * POST /api/documents/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const request: DocumentGenerationRequest = req.body;
    
    // Validate required fields
    if (!request.templateId || !request.variables) {
      return res.status(400).json({ error: 'Template ID and variables are required' });
    }

    const result = await documentService.generateFromTemplate(
      request.templateId,
      request.variables,
      userId,
      req.user?.organizationId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Document generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search documents
 * POST /api/documents/search
 */
router.post('/search', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const criteria: DocumentSearchCriteria = req.body;
    const result = await documentService.searchDocuments(criteria, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Document search error:', error);
    res.status(500).json({ 
      error: 'Failed to search documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user documents
 * GET /api/documents/my
 */
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type, status, limit } = req.query;
    const filters = {
      type: type as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const documents = await documentService.getUserDocuments(userId, filters);

    res.json({
      success: true,
      data: documents
    });

  } catch (error) {
    logger.error('Get user documents error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get document by ID
 * GET /api/documents/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const document = await documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    logger.error('Get document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to retrieve document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Update document
 * PUT /api/documents/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const { title, content, status, confidentialityLevel, tags } = req.body;

    // Get existing document
    const document = await documentService.getDocument(documentId, userId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update document fields
    if (title) document.title = title;
    if (content) document.content = content;
    if (status) document.status = status;
    if (confidentialityLevel) document.confidentialityLevel = confidentialityLevel;
    if (tags) document.metadata.tags = tags;

    const version = await documentService.saveDocument(document, userId, req.body.changes);

    res.json({
      success: true,
      data: {
        document,
        version
      }
    });

  } catch (error) {
    logger.error('Update document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to update document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Delete document
 * DELETE /api/documents/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    await documentService.deleteDocument(documentId, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error('Delete document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Share document
 * POST /api/documents/:id/share
 */
router.post('/:id/share', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const { shareWithUserId, permissions, expiresAt } = req.body;

    if (!shareWithUserId || !permissions) {
      return res.status(400).json({ error: 'Share user ID and permissions are required' });
    }

    await documentService.shareDocument(
      documentId,
      shareWithUserId,
      permissions,
      userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    res.json({
      success: true,
      message: 'Document shared successfully'
    });

  } catch (error) {
    logger.error('Share document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to share document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Export document
 * POST /api/documents/:id/export
 */
router.post('/:id/export', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const options: DocumentExportOptions = req.body;

    if (!options.format) {
      return res.status(400).json({ error: 'Export format is required' });
    }

    const exportData = await documentService.exportDocument(documentId, userId, options);

    // Set appropriate headers
    const contentTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      html: 'text/html',
      txt: 'text/plain'
    };

    const extensions = {
      pdf: 'pdf',
      docx: 'docx',
      html: 'html',
      txt: 'txt'
    };

    res.setHeader('Content-Type', contentTypes[options.format]);
    res.setHeader('Content-Disposition', `attachment; filename="document.${extensions[options.format]}"`);
    res.send(exportData);

  } catch (error) {
    logger.error('Export document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to export document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Bulk operations on documents
 * POST /api/documents/bulk
 */
router.post('/bulk', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const operation: BulkDocumentOperation = req.body;

    if (!operation.documentIds || !operation.operation) {
      return res.status(400).json({ error: 'Document IDs and operation are required' });
    }

    const result = await documentService.bulkOperation(operation, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Bulk operation error:', error);
    res.status(500).json({ 
      error: 'Failed to perform bulk operation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload file attachment
 * POST /api/documents/:id/attachments
 */
router.post('/:id/attachments', upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadResults = [];

    for (const file of files) {
      try {
        const result = await fileStorageService.uploadFile(
          documentId,
          file.buffer,
          file.originalname,
          file.mimetype,
          userId,
          {
            encrypt: req.body.encrypt === 'true',
            generateThumbnail: req.body.generateThumbnail === 'true'
          }
        );

        uploadResults.push({
          success: true,
          attachment: result.attachment
        });

      } catch (fileError) {
        uploadResults.push({
          success: false,
          filename: file.originalname,
          error: fileError instanceof Error ? fileError.message : 'Upload failed'
        });
      }
    }

    res.json({
      success: true,
      data: uploadResults
    });

  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get document attachments
 * GET /api/documents/:id/attachments
 */
router.get('/:id/attachments', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const documentId = req.params.id;
    const attachments = await fileStorageService.getDocumentAttachments(documentId, userId);

    res.json({
      success: true,
      data: attachments
    });

  } catch (error) {
    logger.error('Get attachments error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to retrieve attachments',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Download file attachment
 * GET /api/documents/attachments/:attachmentId/download
 */
router.get('/attachments/:attachmentId/download', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const attachmentId = req.params.attachmentId;
    const result = await fileStorageService.downloadFile(attachmentId, userId);

    res.setHeader('Content-Type', result.attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.attachment.originalFilename}"`);
    res.send(result.buffer);

  } catch (error) {
    logger.error('Download attachment error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to download attachment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Delete file attachment
 * DELETE /api/documents/attachments/:attachmentId
 */
router.delete('/attachments/:attachmentId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const attachmentId = req.params.attachmentId;
    await fileStorageService.deleteFile(attachmentId, userId);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    logger.error('Delete attachment error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete attachment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

export default router;