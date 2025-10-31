'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { Brain, FileText, Plus, Trash2, CheckCircle, Search, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SmartPrescriptionProps {
  patientId?: string;
  diagnosis?: string;
  onSave?: (prescription: any) => void;
  allowPatientSelection?: boolean;
}

export function SmartPrescription({ patientId, diagnosis, onSave, allowPatientSelection = false }: SmartPrescriptionProps) {
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    medications: [] as Array<{ name: string; dosage: string; frequency: string; duration: string; instructions?: string }>,
    glasses: [] as Array<any>,
    notes: '',
  });

  useEffect(() => {
    if (allowPatientSelection && !patientId) {
      loadPatients();
    }
  }, [allowPatientSelection, patientId]);

  useEffect(() => {
    loadTemplates();
    if (diagnosis) {
      loadAISuggestions();
    }
  }, [diagnosis]);

  const loadPatients = async () => {
    try {
      const res = await api.get('/admin/users?role=patient');
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get('/prescriptions/templates');
      setTemplates(res.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAISuggestions = async () => {
    if (!diagnosis) return;
    try {
      const res = await api.post('/prescriptions/ai-suggestions', { diagnosis });
      setAiSuggestions(res.data || []);
      if (res.data && res.data.length > 0) {
        toast({ title: 'AI Suggestions', description: 'Prescription suggestions available' });
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    }
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.medications) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, ...suggestion.medications],
      }));
    }
    if (suggestion.glasses) {
      setFormData(prev => ({
        ...prev,
        glasses: [...prev.glasses, ...suggestion.glasses],
      }));
    }
    if (suggestion.notes) {
      setFormData(prev => ({
        ...prev,
        notes: prev.notes ? `${prev.notes}\n${suggestion.notes}` : suggestion.notes,
      }));
    }
    toast({ title: 'Success', description: 'Suggestion applied to prescription' });
  };

  const applyTemplate = (template: any) => {
    setFormData({
      medications: template.medications || [],
      glasses: template.glasses || [],
      notes: template.notes || '',
    });
    setSelectedTemplate(template);
    toast({ title: 'Success', description: 'Template applied' });
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const handleSave = async () => {
    if (!selectedPatientId && !patientId) {
      toast({
        title: 'Error',
        description: 'Please select a patient first',
        variant: 'destructive',
      });
      return;
    }

    if (formData.medications.length === 0 && formData.glasses.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one medication or glasses prescription',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const finalPatientId = selectedPatientId || patientId;
      const prescription = {
        patientId: finalPatientId,
        medications: formData.medications.filter(med => med.name.trim() !== ''),
        glasses: formData.glasses,
        notes: formData.notes,
      };
      
      if (onSave) {
        await onSave(prescription);
      } else {
        const res = await api.post('/prescriptions', prescription);
        toast({ title: 'Success', description: 'Prescription created successfully' });
      }
      
      // Reset form
      setFormData({ medications: [], glasses: [], notes: '' });
      setSelectedPatientId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save prescription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Smart Prescription Management
        </CardTitle>
        <CardDescription>AI-suggested treatments and prescription templates</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prescription">
          <TabsList>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="ai-suggestions">
              AI Suggestions
              {aiSuggestions.length > 0 && (
                <Badge className="ml-2">{aiSuggestions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescription" className="space-y-4">
            {/* Patient Selection (if allowed) */}
            {allowPatientSelection && !patientId && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label htmlFor="patient-select">Select Patient</Label>
                <select
                  id="patient-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">Select a patient...</option>
                  {patients.map((patient: any) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(!allowPatientSelection || patientId || selectedPatientId) && (
              <>
                {/* Medications */}
                <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medications</Label>
                <Button size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
              <div className="space-y-3">
                {formData.medications.map((med, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={med.name}
                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                            placeholder="e.g., Artificial Tears"
                          />
                        </div>
                        <div>
                          <Label>Dosage</Label>
                          <Input
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="e.g., 1-2 drops"
                          />
                        </div>
                        <div>
                          <Label>Frequency</Label>
                          <Input
                            value={med.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            placeholder="e.g., 4 times daily"
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input
                            value={med.duration}
                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                            placeholder="e.g., 2-4 weeks"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Instructions (Optional)</Label>
                          <Input
                            value={med.instructions || ''}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="Additional instructions"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {formData.medications.length === 0 && (
                  <div className="text-center py-4 border-2 border-dashed rounded-lg p-4">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm mb-2">
                      No medications added yet
                    </p>
                    <Button size="sm" variant="outline" onClick={addMedication}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Medication
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Or use AI Suggestions or Templates tab to get started
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Glasses Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Glasses / Contact Lenses (Optional)</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    glasses: [...prev.glasses, {
                      type: 'glasses',
                      prescription: { sphere: '', cylinder: '', axis: '' },
                      lensType: '',
                    }],
                  }));
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Add Glasses
                </Button>
              </div>
              <div className="space-y-3">
                {formData.glasses.map((glass, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Type</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                            value={glass.type || 'glasses'}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = { ...newGlasses[index], type: e.target.value };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          >
                            <option value="glasses">Glasses</option>
                            <option value="contact_lenses">Contact Lenses</option>
                          </select>
                        </div>
                        <div>
                          <Label>Lens Type</Label>
                          <Input
                            placeholder="e.g., Single Vision, Progressive"
                            value={glass.lensType || ''}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = { ...newGlasses[index], lensType: e.target.value };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Sphere (D)</Label>
                          <Input
                            placeholder="e.g., -2.50"
                            value={glass.prescription?.sphere || ''}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = {
                                ...newGlasses[index],
                                prescription: { ...newGlasses[index].prescription, sphere: e.target.value },
                              };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Cylinder (D)</Label>
                          <Input
                            placeholder="e.g., -1.00"
                            value={glass.prescription?.cylinder || ''}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = {
                                ...newGlasses[index],
                                prescription: { ...newGlasses[index].prescription, cylinder: e.target.value },
                              };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Axis (°)</Label>
                          <Input
                            placeholder="e.g., 90"
                            value={glass.prescription?.axis || ''}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = {
                                ...newGlasses[index],
                                prescription: { ...newGlasses[index].prescription, axis: e.target.value },
                              };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>Frame (Optional)</Label>
                          <Input
                            placeholder="Frame type/brand"
                            value={glass.frame || ''}
                            onChange={(e) => {
                              const newGlasses = [...formData.glasses];
                              newGlasses[index] = { ...newGlasses[index], frame: e.target.value };
                              setFormData(prev => ({ ...prev, glasses: newGlasses }));
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            glasses: prev.glasses.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Prescription Notes</Label>
              <textarea
                className="w-full mt-2 p-3 border rounded-lg"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add prescription notes, instructions, or follow-up recommendations..."
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => {
                  setFormData({ medications: [], glasses: [], notes: '' });
                  setSelectedPatientId('');
                }}
              >
                Clear Form
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading || ((formData.medications.length === 0 || formData.medications.every(m => !m.name.trim())) && formData.glasses.length === 0)}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Prescription'}
              </Button>
            </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="ai-suggestions" className="space-y-3">
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        AI Suggestion {index + 1}
                      </CardTitle>
                      <Button size="sm" onClick={() => applySuggestion(suggestion)}>
                        Apply
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestion.medications && suggestion.medications.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Medications:</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {suggestion.medications.map((med: any, i: number) => (
                            <li key={i}>{med.name} - {med.dosage}, {med.frequency}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestion.glasses && suggestion.glasses.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Glasses:</Label>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.glasses[0]?.lensType || 'Prescription glasses'}
                        </p>
                      </div>
                    )}
                    {suggestion.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes:</Label>
                        <p className="text-sm text-muted-foreground">{suggestion.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {diagnosis ? 'No AI suggestions available' : 'Enter a diagnosis to get AI suggestions'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-3">
            {templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Button size="sm" onClick={() => applyTemplate(template)}>
                        Use Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Specialty: {template.specialty} • {template.medications?.length || 0} medications
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No templates available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

