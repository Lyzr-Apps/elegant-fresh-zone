/**
 * EXL Life - Group Claims Processing Application
 *
 * Complete claims processing system with AI-powered validation,
 * eligibility assessment, and decision recommendation.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Download,
  Filter,
  Search,
  User,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Shield,
  Sparkles,
  ArrowRight,
  X,
  ClipboardCheck,
  Building2,
  Phone,
  Mail,
  CreditCard
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - From workflow.json
// =============================================================================

const AGENT_IDS = {
  claimsCoordinator: "69610b7f5e0239738a838d64",
  documentValidation: "69610b22c57d451439d4be08",
  eligibilityAssessment: "69610b405e0239738a838d56",
  decisionRecommendation: "69610b5cc57d451439d4be18"
}

// =============================================================================
// TypeScript Interfaces - Based on ACTUAL test response data
// =============================================================================

// Document Validation Agent Response
interface DocumentValidationResult {
  validation_status: 'complete' | 'incomplete' | 'invalid'
  required_fields_check: {
    member_id: boolean
    claim_type: boolean
    claim_amount: boolean
    service_date: boolean
    submission_date: boolean
    supporting_documents: boolean
  }
  document_quality: {
    legibility: string
    format_compliance: boolean
    signatures_present: boolean
  }
  inconsistencies_found: Array<{
    field: string
    issue: string
    severity: 'low' | 'medium' | 'high'
  }>
  missing_items: string[]
  validation_summary: string
  recommendations: string[]
}

// Eligibility Assessment Agent Response
interface EligibilityAssessmentResult {
  eligibility_status: 'eligible' | 'ineligible' | 'pending'
  member_status: {
    active_coverage: boolean
    member_id_valid: boolean
    enrollment_date: string
    coverage_effective_date: string
  }
  coverage_assessment: {
    claim_type_covered: boolean
    within_coverage_limits: boolean
    annual_limit: number
    remaining_limit: number
    benefit_cap: number
  }
  waiting_period: {
    applicable: boolean
    satisfied: boolean
    waiting_period_end_date: string
  }
  exclusions_found: string[]
  eligible_amount: number
  ineligible_amount: number
  eligibility_summary: string
  recommendations: string[]
}

// Decision Recommendation Agent Response
interface DecisionRecommendationResult {
  decision_recommendation: 'APPROVE' | 'DENY' | 'REVIEW'
  confidence_level: 'low' | 'medium' | 'high'
  payable_amount: number
  claimed_amount: number
  adjustment_amount: number
  decision_rationale: string
  supporting_factors: Array<{
    factor: string
    impact: 'positive' | 'negative' | 'neutral'
  }>
  red_flags: string[]
  manual_review_required: boolean
  review_reason: string
  next_steps: string[]
  processing_notes: string
}

// Claims Processing Coordinator Response (Full workflow)
interface ClaimsCoordinatorResult {
  claim_id: string
  claim_summary: {
    member_id: string
    claim_type: string
    claimed_amount: number
    service_date: string
    submission_date: string
  }
  validation_results: {
    status: string
    summary: string
    issues: string[]
  }
  eligibility_results: {
    status: string
    eligible_amount: number
    summary: string
  }
  final_recommendation: {
    decision: 'APPROVE' | 'DENY' | 'REVIEW'
    payable_amount: number
    confidence: string
    rationale: string
  }
  workflow_status: string
  next_actions: string[]
  processing_notes: string
}

// Claim data structure
interface ClaimData {
  id: string
  memberName: string
  memberId: string
  claimType: string
  amount: number
  status: 'pending' | 'approved' | 'denied' | 'review'
  submissionDate: string
  priority: 'low' | 'medium' | 'high'
  serviceDate?: string
  provider?: string
}

// Form data structure
interface ClaimFormData {
  memberId: string
  memberName: string
  policyNumber: string
  claimType: string
  claimedAmount: string
  serviceDateFrom: string
  serviceDateTo: string
  provider: string
  providerPhone: string
  diagnosis: string
  documents: string
}

// =============================================================================
// Sample Data
// =============================================================================

const SAMPLE_CLAIMS: ClaimData[] = [
  {
    id: "CLM-001",
    memberName: "Sarah Johnson",
    memberId: "MBR-2024-5678",
    claimType: "Hospital Admission",
    amount: 12500,
    status: "pending",
    submissionDate: "2024-12-20",
    priority: "high",
    serviceDate: "2024-12-15 to 2024-12-18",
    provider: "St. Mary's Hospital"
  },
  {
    id: "CLM-002",
    memberName: "Michael Chen",
    memberId: "MBR-2024-3421",
    claimType: "Outpatient Surgery",
    amount: 4200,
    status: "approved",
    submissionDate: "2024-12-18",
    priority: "medium",
    serviceDate: "2024-12-12",
    provider: "City Medical Center"
  },
  {
    id: "CLM-003",
    memberName: "Emily Rodriguez",
    memberId: "MBR-2024-9012",
    claimType: "Diagnostic Tests",
    amount: 850,
    status: "denied",
    submissionDate: "2024-12-15",
    priority: "low",
    serviceDate: "2024-12-10",
    provider: "HealthLab Diagnostics"
  },
  {
    id: "CLM-004",
    memberName: "David Kim",
    memberId: "MBR-2024-7843",
    claimType: "Emergency Room",
    amount: 3200,
    status: "review",
    submissionDate: "2024-12-19",
    priority: "high",
    serviceDate: "2024-12-18",
    provider: "General Hospital ER"
  },
  {
    id: "CLM-005",
    memberName: "Lisa Thompson",
    memberId: "MBR-2024-2156",
    claimType: "Prescription Medication",
    amount: 450,
    status: "approved",
    submissionDate: "2024-12-17",
    priority: "low",
    serviceDate: "2024-12-16",
    provider: "Pharmacy Plus"
  }
]

const CLAIM_TYPES = [
  "Hospital Admission",
  "Outpatient Surgery",
  "Emergency Room",
  "Diagnostic Tests",
  "Prescription Medication",
  "Physical Therapy",
  "Mental Health Services",
  "Dental Services"
]

// =============================================================================
// Main Component
// =============================================================================

export default function Home() {
  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'newClaim' | 'results'>('dashboard')

  // Claims data state
  const [claims, setClaims] = useState<ClaimData[]>(SAMPLE_CLAIMS)
  const [selectedClaim, setSelectedClaim] = useState<ClaimData | null>(null)

  // Form state
  const [formData, setFormData] = useState<ClaimFormData>({
    memberId: '',
    memberName: '',
    policyNumber: '',
    claimType: '',
    claimedAmount: '',
    serviceDateFrom: '',
    serviceDateTo: '',
    provider: '',
    providerPhone: '',
    diagnosis: '',
    documents: ''
  })

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  // Results state
  const [coordinatorResponse, setCoordinatorResponse] = useState<NormalizedAgentResponse | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false)

  // =============================================================================
  // Computed Values
  // =============================================================================

  const metrics = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    denied: claims.filter(c => c.status === 'denied').length,
    review: claims.filter(c => c.status === 'review').length,
    totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
    avgAmount: claims.length > 0 ? claims.reduce((sum, c) => sum + c.amount, 0) / claims.length : 0
  }

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter
    const matchesSearch = !searchQuery ||
      claim.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleFormChange = (field: keyof ClaimFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProcessClaim = async () => {
    setProcessing(true)
    setProcessingStep(0)

    try {
      // Build the claim message with all form data
      const claimMessage = `Process new claim submission: Member ID: ${formData.memberId}, Member Name: ${formData.memberName}, Policy Number: ${formData.policyNumber}, Claim Type: ${formData.claimType}, Claimed Amount: $${formData.claimedAmount}, Service Dates: ${formData.serviceDateFrom} to ${formData.serviceDateTo}, Provider: ${formData.provider}, Provider Phone: ${formData.providerPhone}, Diagnosis: ${formData.diagnosis}, Documents submitted: ${formData.documents}.`

      // Step 1: Validation (simulated - coordinator handles this)
      setProcessingStep(1)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Eligibility (simulated)
      setProcessingStep(2)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 3: Decision (simulated)
      setProcessingStep(3)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 4: Call Claims Processing Coordinator
      setProcessingStep(4)
      const result = await callAIAgent(
        claimMessage,
        AGENT_IDS.claimsCoordinator,
        {
          user_id: `user-${formData.memberId}`,
          session_id: `claim-${Date.now()}`
        }
      )

      if (result.success) {
        setCoordinatorResponse(result.response)

        // Add new claim to the list
        const newClaim: ClaimData = {
          id: result.response.result?.claim_id || `CLM-${Date.now()}`,
          memberName: formData.memberName,
          memberId: formData.memberId,
          claimType: formData.claimType,
          amount: parseFloat(formData.claimedAmount),
          status: result.response.result?.final_recommendation?.decision === 'APPROVE' ? 'approved' :
                  result.response.result?.final_recommendation?.decision === 'DENY' ? 'denied' : 'review',
          submissionDate: new Date().toISOString().split('T')[0],
          priority: parseFloat(formData.claimedAmount) > 5000 ? 'high' :
                   parseFloat(formData.claimedAmount) > 2000 ? 'medium' : 'low',
          serviceDate: `${formData.serviceDateFrom} to ${formData.serviceDateTo}`,
          provider: formData.provider
        }
        setClaims(prev => [newClaim, ...prev])

        // Navigate to results
        setCurrentView('results')
        setShowNewClaimDialog(false)
      } else {
        alert(`Error processing claim: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
      setProcessingStep(0)
    }
  }

  const handleViewClaim = (claim: ClaimData) => {
    setSelectedClaim(claim)
    // For demo, we'll show a simulated result
    // In production, this would fetch the actual stored results
  }

  const resetForm = () => {
    setFormData({
      memberId: '',
      memberName: '',
      policyNumber: '',
      claimType: '',
      claimedAmount: '',
      serviceDateFrom: '',
      serviceDateTo: '',
      provider: '',
      providerPhone: '',
      diagnosis: '',
      documents: ''
    })
  }

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const getStatusBadge = (status: ClaimData['status']) => {
    const variants = {
      approved: { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600', icon: CheckCircle },
      denied: { variant: 'destructive' as const, className: '', icon: XCircle },
      pending: { variant: 'secondary' as const, className: 'bg-amber-500 hover:bg-amber-600 text-white', icon: Clock },
      review: { variant: 'outline' as const, className: 'border-amber-500 text-amber-700', icon: AlertTriangle }
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: ClaimData['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // =============================================================================
  // View Components
  // =============================================================================

  function DashboardView() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Claims Processing Dashboard</h1>
            <p className="text-gray-600 mt-1">EXL Life Insurance - Group Claims Management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button onClick={() => setShowNewClaimDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Claim
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Claims</CardDescription>
              <CardTitle className="text-3xl">{metrics.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{formatCurrency(metrics.totalAmount)} total value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl">{metrics.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-amber-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2 from yesterday
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approved
              </CardDescription>
              <CardTitle className="text-3xl">{metrics.approved}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{((metrics.approved / metrics.total) * 100).toFixed(0)}% approval rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Denied
              </CardDescription>
              <CardTitle className="text-3xl">{metrics.denied}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{formatCurrency(metrics.avgAmount)} avg claim</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Claims Queue</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.memberName}</div>
                          <div className="text-sm text-gray-500">{claim.memberId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{claim.claimType}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(claim.amount)}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>{getPriorityBadge(claim.priority)}</TableCell>
                      <TableCell className="text-gray-600">{claim.submissionDate}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClaim(claim)}
                        >
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  function NewClaimDialogContent() {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-5 w-5" />
            Submit New Claim
          </DialogTitle>
          <DialogDescription>
            Enter claim details and supporting documentation information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Member Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Member Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID *</Label>
                  <Input
                    id="memberId"
                    placeholder="MBR-2024-XXXX"
                    value={formData.memberId}
                    onChange={(e) => handleFormChange('memberId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberName">Member Name *</Label>
                  <Input
                    id="memberName"
                    placeholder="John Doe"
                    value={formData.memberName}
                    onChange={(e) => handleFormChange('memberName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number *</Label>
                  <Input
                    id="policyNumber"
                    placeholder="GRP-EXL-2024-001"
                    value={formData.policyNumber}
                    onChange={(e) => handleFormChange('policyNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Claim Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Claim Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimType">Claim Type *</Label>
                  <Select value={formData.claimType} onValueChange={(v) => handleFormChange('claimType', v)}>
                    <SelectTrigger id="claimType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimedAmount">Claimed Amount (USD) *</Label>
                  <Input
                    id="claimedAmount"
                    type="number"
                    placeholder="0.00"
                    value={formData.claimedAmount}
                    onChange={(e) => handleFormChange('claimedAmount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceDateFrom">Service Date From *</Label>
                  <Input
                    id="serviceDateFrom"
                    type="date"
                    value={formData.serviceDateFrom}
                    onChange={(e) => handleFormChange('serviceDateFrom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceDateTo">Service Date To *</Label>
                  <Input
                    id="serviceDateTo"
                    type="date"
                    value={formData.serviceDateTo}
                    onChange={(e) => handleFormChange('serviceDateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Provider Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Provider Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider Name *</Label>
                  <Input
                    id="provider"
                    placeholder="St. Mary's Hospital"
                    value={formData.provider}
                    onChange={(e) => handleFormChange('provider', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerPhone">Provider Phone</Label>
                  <Input
                    id="providerPhone"
                    placeholder="(555) 123-4567"
                    value={formData.providerPhone}
                    onChange={(e) => handleFormChange('providerPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis / Reason for Claim *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Describe the medical condition or reason for claim..."
                  value={formData.diagnosis}
                  onChange={(e) => handleFormChange('diagnosis', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documents">Documents Submitted *</Label>
                <Textarea
                  id="documents"
                  placeholder="List all documents submitted (e.g., Medical bills, ID proof, Claim form, Discharge summary)"
                  value={formData.documents}
                  onChange={(e) => handleFormChange('documents', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowNewClaimDialog(false)
              resetForm()
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessClaim}
            disabled={processing || !formData.memberId || !formData.memberName || !formData.claimType || !formData.claimedAmount}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Process Claim
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Processing Progress */}
        {processing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">Processing Claim...</span>
                <span className="text-blue-600">{processingStep}/4</span>
              </div>
              <Progress value={(processingStep / 4) * 100} className="h-2" />
              <div className="space-y-2 text-sm">
                <div className={cn("flex items-center gap-2", processingStep >= 1 ? "text-green-600" : "text-gray-400")}>
                  {processingStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  Document Validation
                </div>
                <div className={cn("flex items-center gap-2", processingStep >= 2 ? "text-green-600" : "text-gray-400")}>
                  {processingStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : processingStep === 2 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Eligibility Assessment
                </div>
                <div className={cn("flex items-center gap-2", processingStep >= 3 ? "text-green-600" : "text-gray-400")}>
                  {processingStep > 3 ? <CheckCircle2 className="h-4 w-4" /> : processingStep === 3 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Decision Recommendation
                </div>
                <div className={cn("flex items-center gap-2", processingStep >= 4 ? "text-green-600" : "text-gray-400")}>
                  {processingStep === 4 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Finalizing Results
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  function ResultsView() {
    if (!coordinatorResponse?.result) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No results available</p>
            <Button
              onClick={() => setCurrentView('dashboard')}
              variant="outline"
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    const result = coordinatorResponse.result as ClaimsCoordinatorResult
    const decision = result.final_recommendation?.decision || 'REVIEW'
    const isApproved = decision === 'APPROVE'
    const isDenied = decision === 'DENY'

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('dashboard')}
              className="mb-2 gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-blue-900">Claim Assessment Results</h1>
            <p className="text-gray-600 mt-1">Claim ID: {result.claim_id || 'N/A'}</p>
          </div>
        </div>

        {/* Decision Summary Card */}
        <Card className={cn(
          "border-2",
          isApproved && "border-green-500 bg-green-50",
          isDenied && "border-red-500 bg-red-50",
          !isApproved && !isDenied && "border-amber-500 bg-amber-50"
        )}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {isApproved && <CheckCircle className="h-8 w-8 text-green-600" />}
                  {isDenied && <XCircle className="h-8 w-8 text-red-600" />}
                  {!isApproved && !isDenied && <AlertTriangle className="h-8 w-8 text-amber-600" />}
                  <div>
                    <CardTitle className="text-2xl">
                      {isApproved && "Claim Approved"}
                      {isDenied && "Claim Denied"}
                      {!isApproved && !isDenied && "Manual Review Required"}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Confidence: {result.final_recommendation?.confidence || 'N/A'}
                    </CardDescription>
                  </div>
                </div>
                <p className="text-gray-700 mt-3">
                  {result.final_recommendation?.rationale || 'No rationale provided'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Payable Amount</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(result.final_recommendation?.payable_amount || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  of {formatCurrency(result.claim_summary?.claimed_amount || 0)} claimed
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Assessment Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Validation Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Document Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={result.validation_results?.status === 'incomplete' ? 'destructive' : 'default'}>
                    {result.validation_results?.status || 'N/A'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {result.validation_results?.summary || 'No summary available'}
                </p>
              </div>

              {result.validation_results?.issues && result.validation_results.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-red-700">Issues Found</h4>
                  <ul className="space-y-1">
                    {result.validation_results.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Assessment Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Eligibility Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={result.eligibility_results?.status === 'eligible' ? 'default' : 'destructive'}>
                    {result.eligibility_results?.status || 'N/A'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {result.eligibility_results?.summary || 'No summary available'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Eligible Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(result.eligibility_results?.eligible_amount || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Notes Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Processing Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {result.processing_notes || 'No additional notes'}
              </p>

              <div>
                <h4 className="text-sm font-semibold mb-2">Workflow Status</h4>
                <Badge variant="outline">{result.workflow_status || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Actions */}
        {result.next_actions && result.next_actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.next_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
            >
              Back to Queue
            </Button>
            <div className="flex gap-3">
              {isApproved && (
                <Button className="bg-green-600 hover:bg-green-700 gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirm Approval
                </Button>
              )}
              {isDenied && (
                <Button variant="destructive" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Confirm Denial
                </Button>
              )}
              {!isApproved && !isDenied && (
                <Button variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50 gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Escalate for Review
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Raw Response Debug (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug: Raw Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(coordinatorResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Top Navigation Bar */}
        <div className="bg-blue-900 text-white px-6 py-4 rounded-lg mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">EXL Life Insurance</h2>
                <p className="text-blue-200 text-sm">Group Claims Processing System</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Claims Administrator</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Router */}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'results' && <ResultsView />}

        {/* New Claim Dialog */}
        <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
          <DialogContent className="max-w-3xl">
            <NewClaimDialogContent />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
