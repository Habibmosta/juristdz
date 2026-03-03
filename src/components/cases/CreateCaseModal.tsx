import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Calendar, AlertCircle } from 'lucide-react';
import { CaseService } from '../../services/caseService';
import { ClientService } from '../../services/clientService';
import type { Client } from '../../types/client.types';
import { useAuth } from '../../hooks/useAuth';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
 