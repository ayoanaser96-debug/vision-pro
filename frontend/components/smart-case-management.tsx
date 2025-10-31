'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageViewer } from './image-viewer';
import api from '@/lib/api';
import { 
  AlertCircle, 
  Clock, 
  Users, 
  MessageSquare, 
  Send, 
  FileText, 
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SmartCaseManagementProps {
  doctorId: string;
  onCaseSelect?: (caseData: any) => void;
}

export function SmartCaseManagement({ doctorId, onCaseSelect }: SmartCaseManagementProps) {
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadCases();
    loadNotifications();
  }, [doctorId]);

  const loadCases = async () => {
    try {
      const res = await api.get('/cases/my-cases');
      setCases(res.data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleDelegate = async (caseId: string, toDoctorId: string) => {
    try {
      await api.put(`/cases/${caseId}/delegate`, { toDoctorId });
      toast({ title: 'Success', description: 'Case delegated successfully' });
      loadCases();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delegate case',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (caseId: string, status: string) => {
    try {
      await api.put(`/cases/${caseId}/status`, { status });
      toast({ title: 'Success', description: 'Case status updated' });
      loadCases();
      if (selectedCase?._id === caseId) {
        setSelectedCase({ ...selectedCase, status });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredCases = cases.filter((caseItem: any) => {
    const matchesSearch = !searchTerm || 
      caseItem.patientId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const urgentCases = filteredCases.filter((c: any) => c.priority === 'urgent' || c.priority === 'high');

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Case Management</h2>
          <p className="text-muted-foreground">AI-prioritized cases with collaborative workflow</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="relative">
            <AlertCircle className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cases.filter((c: any) => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cases.filter((c: any) => c.status === 'open').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Cases</CardTitle>
                  <CardDescription>AI-prioritized case list</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredCases.length > 0 ? (
                  filteredCases.map((caseItem: any) => (
                    <div
                      key={caseItem._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCase?._id === caseItem._id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        if (onCaseSelect) {
                          onCaseSelect(caseItem);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(caseItem.priority)}>
                              {caseItem.priority}
                            </Badge>
                            <Badge variant="outline">{caseItem.status}</Badge>
                          </div>
                          <p className="font-medium">
                            {caseItem.patientId?.firstName} {caseItem.patientId?.lastName}
                          </p>
                          {caseItem.aiInsights && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>Urgency: {caseItem.aiInsights.urgency}%</p>
                              {caseItem.aiInsights.riskFactors.length > 0 && (
                                <p className="text-red-600">
                                  Risk: {caseItem.aiInsights.riskFactors.join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No cases found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Details */}
        {selectedCase && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
                <CardDescription>Complete case information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Patient Information</h3>
                      <p className="text-sm">
                        {selectedCase.patientId?.firstName} {selectedCase.patientId?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedCase.patientId?.email}</p>
                    </div>

                    {selectedCase.aiInsights && (
                      <div>
                        <h3 className="font-medium mb-2">AI Insights</h3>
                        <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Urgency Score:</span> {selectedCase.aiInsights.urgency}%
                          </p>
                          {selectedCase.aiInsights.riskFactors.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Risk Factors:</p>
                              <ul className="text-sm list-disc list-inside">
                                {selectedCase.aiInsights.riskFactors.map((risk: string, i: number) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {selectedCase.aiInsights.recommendations.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Recommendations:</p>
                              <ul className="text-sm list-disc list-inside">
                                {selectedCase.aiInsights.recommendations.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(selectedCase._id, 'in_progress')}
                        >
                          Start Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(selectedCase._id, 'reviewed')}
                        >
                          Mark Reviewed
                        </Button>
                      </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-2">
                    {selectedCase.timeline && selectedCase.timeline.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCase.timeline.map((entry: any, index: number) => (
                          <div key={index} className="flex gap-3 border-l-2 pl-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2 -ml-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No timeline entries</p>
                    )}
                  </TabsContent>

                  <TabsContent value="images">
                    {selectedCase.eyeTestId?.retinaImages && selectedCase.eyeTestId.retinaImages.length > 0 ? (
                      <ImageViewer
                        images={selectedCase.eyeTestId.retinaImages}
                        showHeatmap={true}
                        heatmapData={[
                          { x: 30, y: 40, intensity: 0.7 },
                          { x: 60, y: 50, intensity: 0.5 },
                        ]}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">No images available</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

