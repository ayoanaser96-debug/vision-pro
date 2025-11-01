'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { MessageCircle, Send, ArrowLeft, User, Phone, Video, Mail, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PharmacyChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!loading && !['pharmacy', 'admin'].includes(user?.role || '')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadPrescriptions();
    }
  }, [user]);

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    const prescriptionId = searchParams.get('prescriptionId');
    
    if (doctorId && contacts.length > 0) {
      const contact = contacts.find((c: any) => c._id === doctorId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
    
    if (prescriptionId && prescriptions.length > 0) {
      const prescription = prescriptions.find((p: any) => p._id === prescriptionId);
      if (prescription) {
        setSelectedPrescription(prescription);
        if (prescription.doctorId) {
          const contact = contacts.find((c: any) => c._id === prescription.doctorId?._id || c._id === prescription.doctorId);
          if (contact) {
            setSelectedContact(contact);
          }
        }
      }
    }
  }, [searchParams, contacts, prescriptions]);

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact._id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await api.get('/chat/contacts');
      setContacts(res.data.contacts || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const res = await api.get('/pharmacy/prescriptions');
      setPrescriptions(res.data || []);
    } catch (error: any) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadConversation = async (userId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/conversation?userId=${userId}`);
      setMessages(res.data || []);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        receiverId: selectedContact._id,
        message: newMessage.trim(),
        prescriptionId: selectedPrescription?._id,
      };

      await api.post('/chat/message', messageData);

      // Add message to local state immediately
      const message = {
        _id: Date.now().toString(),
        senderId: user?.id,
        receiverId: selectedContact._id,
        message: newMessage.trim(),
        createdAt: new Date(),
        isRead: false,
      };
      setMessages((prev) => [...prev, message]);
      setNewMessage('');

      // Reload conversation to get server timestamp
      setTimeout(() => {
        loadConversation(selectedContact._id);
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    if (prescription.doctorId) {
      const doctorId = prescription.doctorId._id || prescription.doctorId;
      const contact = contacts.find((c: any) => c._id === doctorId);
      if (contact) {
        setSelectedContact(contact);
        router.push(`/dashboard/pharmacy/chat?doctorId=${doctorId}&prescriptionId=${prescription._id}`);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPrescriptionForDoctor = (doctorId: string) => {
    return prescriptions.find((p: any) => {
      const pDoctorId = p.doctorId?._id || p.doctorId;
      return pDoctorId === doctorId;
    });
  };

  if (loading || loadingContacts) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/pharmacy')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              Doctor-Pharmacist Chat
            </h1>
            <p className="text-sm text-muted-foreground">
              Chat with doctors about prescriptions
            </p>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Sidebar - Contacts & Prescriptions */}
          <div className="w-80 border-r flex flex-col">
            {/* Prescriptions Section */}
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Prescriptions
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {prescriptions.length > 0 ? (
                  prescriptions.slice(0, 5).map((prescription: any) => {
                    const doctorId = prescription.doctorId?._id || prescription.doctorId;
                    const isSelected = selectedPrescription?._id === prescription._id;
                    return (
                      <div
                        key={prescription._id}
                        onClick={() => handleSelectPrescription(prescription)}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-accent'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {prescription.patientId?.firstName} {prescription.patientId?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {prescription.doctorId?.firstName} {prescription.doctorId?.lastName}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {prescription.status}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No prescriptions</p>
                )}
              </div>
            </div>

            {/* Contacts Section */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold mb-2">Doctors</h3>
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact: any) => {
                    const isSelected = selectedContact?._id === contact._id;
                    const prescription = getPrescriptionForDoctor(contact._id);
                    
                    return (
                      <div
                        key={contact._id}
                        onClick={() => {
                          setSelectedContact(contact);
                          if (prescription) {
                            setSelectedPrescription(prescription);
                          }
                          router.push(`/dashboard/pharmacy/chat?doctorId=${contact._id}${prescription ? `&prescriptionId=${prescription._id}` : ''}`);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              Dr. {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contact.prescriptionCount || 0} prescriptions
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No doctors available. Prescriptions will appear here once assigned.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Dr. {selectedContact.firstName} {selectedContact.lastName}
                      </p>
                      {selectedPrescription && (
                        <p className="text-xs text-muted-foreground">
                          Prescription: {selectedPrescription.patientId?.firstName} {selectedPrescription.patientId?.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message: any) => {
                      const isOwnMessage = message.senderId === user?.id || message.senderId?._id === user?.id;
                      const senderName = isOwnMessage
                        ? 'You'
                        : message.senderId?.firstName
                        ? `${message.senderId.firstName} ${message.senderId.lastName}`
                        : 'Unknown';

                      return (
                        <div
                          key={message._id || message.createdAt}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs font-medium mb-1">{senderName}</p>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  {selectedPrescription && (
                    <div className="mb-2 p-2 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-1">About Prescription:</p>
                      <p className="text-xs text-muted-foreground">
                        Patient: {selectedPrescription.patientId?.firstName} {selectedPrescription.patientId?.lastName}
                        {selectedPrescription.diagnosis && ` • Diagnosis: ${selectedPrescription.diagnosis}`}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a doctor to start chatting</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Or select a prescription to chat with the prescribing doctor
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

