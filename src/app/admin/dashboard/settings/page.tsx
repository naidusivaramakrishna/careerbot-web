"use client"
import { Check, Plus } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import AddPlanModal from './_components/AddPlanModal';
import Switch from '@/components/common/Switch';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  setPopularPlan,
  PlanItem
} from '@/api/adminPlansApi';
import { toast } from 'sonner';

const featureList = [
  {
    key: "resume_builder",
    name: "Resume Builder",
    description: "resume creation and optimization",
  },
  {
    key: "job_match",
    name: "Job Match",
    description: "job match analysis",
  },
  {
    key: "ats_scan",
    name: "ATS Scan",
    description: "Users may scan resumes without any login obligation",
  },
  {
    key: "job_alerts",
    name: "Job Alerts",
    description: "Send Email notifications for new job matches",
  },
  {
    key: "linkedIn_import",
    name: "LinkedIn Import",
    description: "Import profile details from LinkedIn",
  },
  {
    key: "email_notifications",
    name: "Email Notifications",
    description: "Email alerts for system updates are enabled",
  },
  {
    key: "beta_features",
    name: "Beta Features",
    description: "Enable experimental features for testing",
  },
  {
    key: "dark_mode",
    name: "Dark Mode",
    description: "User can switch between light and dark themes",
  },
];

const AdminSettings = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Subscription Plans");
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    planName: "",
    price: "",
    resumeLimit: "",
    jobLimit: "",
    aiCredits: "",
    templates: "",
    features: [] as string[]
  });

  // Fetch plans on mount
  useEffect(() => {
    if (activeTab === "Subscription Plans") {
      fetchPlans();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getAllPlans();
      setPlans(response.plans);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      // Validation
      if (!formData.planName || !formData.price) {
        toast.error('Plan name and price are required');
        return;
      }

      const planData = {
        name: formData.planName,
        price: parseFloat(formData.price),
        resume_scan_limit: parseInt(formData.resumeLimit) || 0,
        job_application_limit: parseInt(formData.jobLimit) || 0,
        ai_credits: parseInt(formData.aiCredits) || 0,
        templates: (formData.templates.toLowerCase().replace(/\s+/g, '_') || 'limited') as 'limited' | 'premium' | 'unlimited',
        features: formData.features,
        is_active: true,
      };

      await createPlan(planData);
      toast.success('Plan created successfully');
      setModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast.error(error.response?.data?.detail || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async () => {
    try {
      if (!selectedPlanId) return;

      // Validation
      if (!formData.planName || !formData.price) {
        toast.error('Plan name and price are required');
        return;
      }

      const planData = {
        name: formData.planName,
        price: parseFloat(formData.price),
        resume_scan_limit: parseInt(formData.resumeLimit) || 0,
        job_application_limit: parseInt(formData.jobLimit) || 0,
        ai_credits: parseInt(formData.aiCredits) || 0,
        templates: (formData.templates.toLowerCase().replace(/\s+/g, '_') || 'limited') as 'limited' | 'premium' | 'unlimited',
        features: formData.features,
      };

      await updatePlan(selectedPlanId, planData);
      toast.success('Plan updated successfully');
      setModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error(error.response?.data?.detail || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePlan(planId);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete plan. It may have active subscribers.');
    }
  };

  const handleSetPopular = async (planId: string) => {
    try {
      await setPopularPlan(planId);
      toast.success('Popular plan updated');
      fetchPlans();
    } catch (error: any) {
      console.error('Error setting popular plan:', error);
      toast.error(error.response?.data?.detail || 'Failed to set popular plan');
    }
  };

  const handleEditPlan = (plan: PlanItem) => {
    setModalMode("edit");
    setSelectedPlanId(plan.id);

    setFormData({
      planName: plan.name,
      price: plan.price.toString(),
      resumeLimit: plan.resume_scan_limit.toString(),
      jobLimit: plan.job_application_limit.toString(),
      aiCredits: plan.ai_credits.toString(),
      templates: formatTemplateForDisplay(plan.templates),
      features: plan.features,
    });

    setModalOpen(true);
  };

  const handleAddPlan = () => {
    setModalMode("add");
    setSelectedPlanId(null);
    resetForm();
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      planName: "",
      price: "",
      resumeLimit: "",
      jobLimit: "",
      aiCredits: "",
      templates: "",
      features: []
    });
  };

  const formatTemplateForDisplay = (template: string) => {
    // Convert "limited" to "Limited Templates"
    const templateMap: { [key: string]: string } = {
      'limited': 'Limited Templates',
      'premium': 'Premium Templates',
      'unlimited': 'Unlimited Templates',
      'basic': 'Basic Templates'
    };
    return templateMap[template.toLowerCase()] || 'Limited Templates';
  };

  const [flags, setFlags] = useState({
    resume_builder: true,
    job_match: true,
    ats_scan: true,
    job_alerts: true,
    linkedIn_import: true,
    email_notifications: false,
    beta_features: false,
    dark_mode: false,
  });

  const toggleFlag = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [config, setConfig] = useState({
    maintenanceMode: false,
    platformName: "CareerBot",
    supportEmail: "",
    maxUsers: "20,000",
    maxFileSize: "2MB",
    apiRequests: "1,000",
    fileUploads: "200",
    loginMethods: ["Email", "Google"],
    fileTypes: ["Pdf", "Docx"],
  });

  const toggleLoginMethod = (method: string) => {
    setConfig((prev) => {
      const exists = prev.loginMethods.includes(method);
      return {
        ...prev,
        loginMethods: exists
          ? prev.loginMethods.filter((m) => m !== method)
          : [...prev.loginMethods, method],
      };
    });
  };

  const toggleFileType = (type: string) => {
    setConfig((prev) => {
      const exists = prev.fileTypes.includes(type);
      return {
        ...prev,
        fileTypes: exists
          ? prev.fileTypes.filter((f) => f !== type)
          : [...prev.fileTypes, type],
      };
    });
  };

  const resetConfig = () => {
    setConfig({
      maintenanceMode: false,
      platformName: "",
      supportEmail: "",
      maxUsers: "",
      maxFileSize: "2MB",
      apiRequests: "",
      fileUploads: "",
      loginMethods: [],
      fileTypes: [],
    });
  };

  return (
    <div>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='font-semibold text-xl'>Settings</h1>
          <p className="text-[#4A5565] text-xs">
            Manage Subscription Plans, Feature Flags and system configuration.
          </p>
        </div>
        {activeTab === "Subscription Plans" && (
          <button
            onClick={handleAddPlan}
            className='bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#4E4EEF] transition'>
            <Plus className='w-4 h-4 ' />
            Create new plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white my-8 p-1 max-w-xl flex items-center gap-4 text-sm rounded-lg">
        {["Subscription Plans", "Feature Flags", "System configuration"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full font-semibold py-2 ${activeTab === tab
              ? "bg-[#ECECF0] rounded-lg px-4"
              : ""
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Subscription Plans" && (
        <div>
          <div className='my-4'>
            <h1 className='font-semibold text-lg'>Manage Subscription plans</h1>
            <p className="text-[#4A5565] text-xs">Configure pricing and features for each plan</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No plans found. Create your first plan to get started.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {plans.map((plan) => (
                <div key={plan.id}
                  className={`relative bg-white border rounded-xl p-4 ${plan.is_popular
                    ? "border-2 border-[#5E5EFF] shadow-md"
                    : "border-gray-200"
                    }`}>
                  {/* Most Popular Tag */}
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 bg-[#5E5EFF] text-white text-xs font-semibold px-3 py-1 rounded-bl-md rounded-tr-md shadow-md">
                      Most Popular
                    </div>
                  )}

                  {/* Status Badge */}
                  {!plan.is_active && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-br-md rounded-tl-md shadow-md">
                      Inactive
                    </div>
                  )}

                  <div className='border-b border-gray-400 my-4 pb-2 mt-8'>
                    <h1 className='text-xl font-semibold'>{plan.name}</h1>
                    <p className='text-[#717182]'>
                      <span className='text-2xl text-black'>₹{plan.price}</span> /month
                    </p>
                  </div>

                  <div className='my-8 min-h-40'>
                    {plan.features.map((feature, index) => (
                      <div key={index} className='text-sm flex gap-1 leading-8 items-center'>
                        <Check className='w-4 h-4 text-[#00A63E]' />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleEditPlan(plan)}
                    className='w-full text-sm px-4 py-2 rounded-lg border border-black/40 my-8 font-semibold hover:bg-gray-50 transition'>
                    Edit Plan
                  </button>

                  <div className='border-t border-gray-400 py-4 mt-4 text-sm flex justify-between items-center'>
                    <p className='text-[#717182]'>Active Users</p>
                    <div className='border border-[#717182] px-2 py-1 rounded-md font-semibold'>
                      {plan.active_users.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Feature Flags" && (
        <div className='bg-white p-6 rounded-lg'>
          <div className='flex justify-between items-center'>
            <div className="my-4">
              <h1 className="font-semibold text-lg">Manage Feature Flags</h1>
              <p className="text-[#4A5565] text-xs">
                Enable or disable platform features across the platform.
              </p>
            </div>
            <button
              className='bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#4E4EEF] transition'>
              Save all changes
            </button>
          </div>
          <div className="flex flex-col mt-6">
            {featureList.map((feature) => (
              <div
                key={feature.key}
                className="bg-white border border-gray-200 p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-sm">{feature.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                </div>

                <Switch
                  checked={flags[feature.key as keyof typeof flags]}
                  onChange={() => toggleFlag(feature.key)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "System configuration" && (
        <div>
          <div className="my-4">
            <h1 className="font-semibold text-lg">Manage System Configuration</h1>
            <p className="text-[#4A5565] text-xs">
              Platform-wide settings and environment configurations.
            </p>
          </div>

          {/* Maintenance Mode Box */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Maintenance Mode</h2>
              <p className="text-[#4A5565] text-xs">
                Enable maintenance mode to temporarily disable the platform
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={config.maintenanceMode}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    maintenanceMode: !prev.maintenanceMode,
                  }))
                }
              />
              <span className="text-sm text-gray-600">
                Maintenance Mode is {config.maintenanceMode ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Platform Name */}
              <div>
                <p className="text-sm font-semibold">Platform Name</p>
                <input
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.platformName}
                  onChange={(e) =>
                    setConfig({ ...config, platformName: e.target.value })
                  }
                />
              </div>

              {/* Support Email */}
              <div>
                <p className="text-sm font-semibold">Support Email</p>
                <input
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.supportEmail}
                  onChange={(e) =>
                    setConfig({ ...config, supportEmail: e.target.value })
                  }
                />
              </div>

              {/* Maximum Users */}
              <div>
                <p className="text-sm font-semibold">Maximum Users</p>
                <input
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.maxUsers}
                  onChange={(e) =>
                    setConfig({ ...config, maxUsers: e.target.value })
                  }
                />
              </div>

              {/* Max File Size */}
              <div>
                <p className="text-sm font-semibold">Max File Size (MB)</p>
                <select
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.maxFileSize}
                  onChange={(e) =>
                    setConfig({ ...config, maxFileSize: e.target.value })
                  }
                >
                  <option>1MB</option>
                  <option>2MB</option>
                  <option>5MB</option>
                  <option>10MB</option>
                </select>
              </div>

              {/* API Requests */}
              <div>
                <p className="text-sm font-semibold">API Requests per hour</p>
                <input
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.apiRequests}
                  onChange={(e) =>
                    setConfig({ ...config, apiRequests: e.target.value })
                  }
                />
              </div>

              {/* File Uploads per hour */}
              <div>
                <p className="text-sm font-semibold">File Uploads per hour</p>
                <input
                  className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                  value={config.fileUploads}
                  onChange={(e) =>
                    setConfig({ ...config, fileUploads: e.target.value })
                  }
                />
              </div>

              {/* Login Methods */}
              <div className="mt-6">
                <p className="text-sm font-semibold">Allowed Login Methods</p>
                <div className="flex gap-5 mt-2 text-sm">
                  {["Email", "Google", "GitHub", "LinkedIn"].map((method) => (
                    <label key={method} className="flex gap-1 items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.loginMethods.includes(method)}
                        onChange={() => toggleLoginMethod(method)}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              {/* Allowed File Types */}
              <div className="mt-6">
                <p className="text-sm font-semibold">Allowed File Types</p>
                <div className="flex gap-5 mt-2 text-sm">
                  {["Jpg", "Png", "Pdf", "Docx"].map((file) => (
                    <label key={file} className="flex gap-1 items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.fileTypes.includes(file)}
                        onChange={() => toggleFileType(file)}
                      />
                      {file}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <button
                className="px-5 py-2 border border-black rounded-lg text-sm text-[#9E5559] hover:bg-gray-50 transition"
                onClick={resetConfig}
              >
                Reset to Default
              </button>

              <button className="px-6 py-2 bg-[#5E5EFF] text-white rounded-lg text-sm hover:bg-[#4E4EEF] transition">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddPlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        onApply={modalMode === "add" ? handleCreatePlan : handleUpdatePlan}
        onDelete={modalMode === "edit" && selectedPlanId ? () => {
          const plan = plans.find(p => p.id === selectedPlanId);
          if (plan) handleDeletePlan(plan.id, plan.name);
        } : undefined}
        onSetPopular={modalMode === "edit" && selectedPlanId ? () => handleSetPopular(selectedPlanId) : undefined}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        isPopular={modalMode === "edit" && selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.is_popular : false}
      />
    </div>
  )
}

export default AdminSettings