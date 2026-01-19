// "use client";
// import React, { useState } from "react";
// import { X, Phone, MapPin, Calendar, CreditCard, FileText, Activity, SquarePen, Trash2, Ban } from "lucide-react";
// import ToggleSwitch from "@/components/common/ToggleSwitch";

// interface User {
//     name: string;
//     email: string;
//     role: string;
//     subscription: "Free" | "Basic" | "Pro" | "Enterprise";
//     status: "Active" | "Inactive" | "Suspended";
//     joinDate: string;
// }

// interface Props {
//     user: User | null;
//     onClose: () => void;
// }

// const UserDetailsModal: React.FC<Props> = ({ user, onClose }) => {
//     const [activeTab, setActiveTab] = useState("Subscription");

//     if (!user) return null;

//     // Dummy data for demonstration
//     const subscriptionData = {
//         currentPlan: user.subscription,
//         billingCycle: "Monthly",
//         nextBillingDate: "Feb 15, 2026",
//         amount: "₹699/month",
//         autoRenewal: true,
//     };

//     const resumesData = [
//         { id: 1, name: "Frontend Developer Resume", date: "15 Jan 2026" },
//         { id: 2, name: "React Intern Resume", date: "10 Dec 2025" },
//     ];

//     const paymentsData = [
//         { id: 1, date: "15 Jan 2026", amount: "₹699", status: "Paid" },
//         { id: 2, date: "15 Dec 2025", amount: "₹699", status: "Paid" },
//     ];

//     const activityData = [
//         { date: "15 Jan 2026 / 12:30pm", activity: "Login", message: "Logged in from Chrome on Windows" },
//         { date: "15 Dec 2025 / 10:40am", activity: "API Call", message: "Generated Resume" },
//     ];

//     if (!user) return null;

//     return (
//         <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
//             <div className="bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full max-w-2xl p-6 relative">
//                 {/* Close Button */}
//                 <button
//                     onClick={onClose}
//                     className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
//                 >
//                     <X size={20} />
//                 </button>

//                 {/* Header */}
//                 <h2 className="text-xl font-semibold">User Details</h2>
//                 <p className="text-sm text-gray-500 mb-4">
//                     Complete information about {user.name}
//                 </p>

//                 {/* Profile Section */}
//                 <div className="bg-gray-50 p-4 my-6 rounded-xl border border-[#00000066]/40">
//                     <div className="flex items-center justify-between  my-4">
//                         <div className="flex items-center gap-3">
//                             <div className="bg-gradient-to-r from-[#155DFC] to-[#4F39F6] text-white w-16 h-16 flex items-center justify-center rounded-lg">
//                                 {user.name.charAt(0)}
//                             </div>
//                             <div>
//                                 <h3 className="font-semibold">{user.name}</h3>
//                                 <p className="text-gray-500 text-sm">{user.email}</p>
//                             </div>
//                         </div>

//                         <span
//                             className={`text-xs px-3 py-1 rounded-md font-medium ${user.status === "Active"
//                                 ? "text-[#008236] bg-green-100"
//                                 : user.status === "Inactive"
//                                     ? "text-gray-600 bg-gray-100"
//                                     : "text-red-600 bg-red-100"
//                                 }`}
//                         >
//                             {user.status}
//                         </span>
//                     </div>

//                     {/* Info Row */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm py-4 text-gray-700 my-4 border-t">
//                         <div className="flex items-center gap-2">
//                             <Phone size={16} className="text-gray-500" />
//                             +91 12022947006
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <MapPin size={16} className="text-gray-500" />
//                             Hyderabad, India
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <Calendar size={16} className="text-gray-500" />
//                             Joined {user.joinDate}
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <CreditCard size={16} className="text-gray-500" />
//                             {user.subscription} Plan
//                         </div>
//                     </div>
//                 </div>
//                 {/* Tabs */}
//                 <div className="border-b border-gray-200 bg-[#ECECF0] my-4 p-1 flex items-center justify-evenly gap-6 text-sm rounded-lg">
//                     {["Subscription", "Resumes", "Payments", "Activity"].map((tab) => (
//                         <button
//                             key={tab}
//                             onClick={() => setActiveTab(tab)}
//                             className={`font-medium w-full py-2 ${activeTab === tab
//                                 ? "bg-white rounded-lg px-4"
//                                 : "text-gray-500 hover:text-gray-700"
//                                 }`}
//                         >
//                             {tab}
//                         </button>
//                     ))}
//                 </div>

//                 {/* Tab Content */}
//                 {activeTab === "Subscription" && (
//                     <div className="border border-[#00000033]/40 p-4 rounded-lg text-sm">
//                         <h4 className="font-semibold mb-3">Subscription Details</h4>
//                         <div className="space-y-1">
//                             <p className="flex justify-between items-center">
//                                 <span className="font-medium">Current Plan:</span>{" "}
//                                 {subscriptionData.currentPlan}
//                             </p>
//                             <p className="flex justify-between items-center">
//                                 <span className="font-medium">Billing Cycle:</span>{" "}
//                                 {subscriptionData.billingCycle}
//                             </p>
//                             <p className="flex justify-between items-center">
//                                 <span className="font-medium">Next Billing Date:</span>{" "}
//                                 {subscriptionData.nextBillingDate}
//                             </p>
//                             <p className="flex justify-between items-center">
//                                 <span className="font-medium">Amount:</span>{" "}
//                                 {subscriptionData.amount}
//                             </p>
//                         </div>
//                         <div className="flex items-center justify-between mt-3 border-t border-[#00000033]/40  py-2">
//                             <span className="font-semibold">Auto-renewal</span>
//                             <ToggleSwitch
//                                 initial={false}
//                                 onToggle={(state) => console.log("Toggled:", state)}
//                             />
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === "Resumes" && (
//                     <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
//                         <h4 className="font-semibold mb-3 flex items-center gap-2">
//                             <FileText size={16} /> Resumes List
//                         </h4>
//                         <div className="divide-y divide-gray-300">
//                             {resumesData.map((resume) => (
//                                 <div
//                                     key={resume.id}
//                                     className="py-2 flex justify-between items-center"
//                                 >
//                                     <div>
//                                         <p className="font-semibold text-black">{resume.name}</p>
//                                         <p className="text-gray-500 text-xs">Last updated: {resume.date}</p>
//                                     </div>
//                                     <span className="cursor-pointer font-semibold">View</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === "Payments" && (
//                     <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
//                         <h4 className="font-semibold mb-3 flex items-center gap-2">
//                             <CreditCard size={16} /> Payment History
//                         </h4>
//                         <div className="divide-y divide-gray-300">
//                             {paymentsData.map((payment) => (
//                                 <div key={payment.id} className="py-2 flex justify-between items-center">
//                                     <div>
//                                         <p className="font-semibold text-black">{payment.amount}</p>
//                                         <p className="text-gray-500 text-xs">{payment.date}</p>
//                                     </div>
//                                     <span
//                                         className={`py-2 ${payment.status === "Paid"
//                                             ? "text-green-600"
//                                             : "text-red-600"
//                                             }`}
//                                     >
//                                         {payment.status}
//                                     </span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === "Activity" && (
//                     <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
//                         <h4 className="font-semibold mb-3 flex items-center gap-2">
//                             <Activity size={16} /> Activity Logs
//                         </h4>
//                         <div className="divide-y divide-gray-300">
//                             {activityData.map((item, index) => (
//                                 <div
//                                     key={index}
//                                     className="py-2 flex justify-between items-center"
//                                 >
//                                     <div>
//                                         <p className="font-semibold text-black">{item.activity}</p>
//                                         <p className="text-gray-500 text-xs">{item.message}</p>
//                                     </div>
//                                     <div>
//                                         <p className="">{item.date}</p>
//                                         <p className="text-right">IP: 192.168.1.1</p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 <div className="grid grid-cols-3 gap-4 my-4">
//                     <button className="flex items-center justify-center text-sm gap-2 p-2 rounded-lg text-white bg-[#155DFC]">
//                         <SquarePen className="w-4 h-4" />
//                         <span>Edit User</span>
//                     </button>
//                     <button className="flex items-center justify-center  text-sm gap-2 p-2 rounded-lg text-[#9E5559] border">
//                         <Ban className="w-4 h-4" />
//                         <span>Suspend</span>
//                     </button>
//                     <button className="flex items-center justify-center  text-sm gap-2 p-2 rounded-lg text-[#E7000B] bg-[#FF5B5B33]">
//                         <Trash2 className="w-4 h-4" />
//                         <span>Delete</span>
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default UserDetailsModal;


"use client";
import React, { useState, useEffect } from "react";
import { X, Phone, MapPin, Calendar, CreditCard, FileText, Activity, SquarePen, Trash2, Ban, Check } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";
import {
    getUserDetails,
    getUserActivity,
    updateUser,
    deleteUser,
    suspendUser,
    unsuspendUser,
    UserDetailsResponse,
    UserActivityLog
} from "@/api/userManagementApi";
import { toast } from "sonner";

interface Props {
    userId: string;
    onClose: () => void;
}

const UserDetailsModal: React.FC<Props> = ({ userId, onClose }) => {
    const [activeTab, setActiveTab] = useState("Subscription");
    const [user, setUser] = useState<UserDetailsResponse | null>(null);
    const [activities, setActivities] = useState<UserActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        email: "",
        full_name: "",
        role: "",
        subscription_plan: "",
    });

    // Suspension form
    const [suspendReason, setSuspendReason] = useState("");
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);

    // Delete form
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");
    const [deletePermanent, setDeletePermanent] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Fetch user details
    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const details = await getUserDetails(userId);
            setUser(details);

            // Initialize edit form
            setEditForm({
                email: details.email,
                full_name: details.full_name,
                role: details.role,
                subscription_plan: details.subscription || "free",
            });
        } catch (error: any) {
            console.error("Error fetching user details:", error);
            toast.error(error.response?.data?.detail || "Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    // Fetch activity when tab is opened
    useEffect(() => {
        if (activeTab === "Activity" && user) {
            fetchUserActivity();
        }
    }, [activeTab]);

    const fetchUserActivity = async () => {
        try {
            const response = await getUserActivity(userId, {
                page: 1,
                page_size: 10,
            });
            setActivities(response.activities);
        } catch (error) {
            console.error("Error fetching user activity:", error);
        }
    };

    // Handle edit user
    const handleEditUser = async () => {
        try {
            setActionLoading(true);

            await updateUser(userId, editForm);

            toast.success("User updated successfully");
            setIsEditing(false);
            await fetchUserDetails(); // Refresh data
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.error(error.response?.data?.detail || "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle suspend user
    const handleSuspendUser = async () => {
        if (!suspendReason || suspendReason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);

            await suspendUser(userId, {
                reason: suspendReason,
                notify_user: true,
            });

            toast.success("User suspended successfully");
            setShowSuspendDialog(false);
            setSuspendReason("");
            await fetchUserDetails();
        } catch (error: any) {
            console.error("Error suspending user:", error);
            toast.error(error.response?.data?.detail || "Failed to suspend user");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle unsuspend user
    const handleUnsuspendUser = async () => {
        try {
            setActionLoading(true);

            await unsuspendUser(userId);

            toast.success("User unsuspended successfully");
            await fetchUserDetails();
        } catch (error: any) {
            console.error("Error unsuspending user:", error);
            toast.error(error.response?.data?.detail || "Failed to unsuspend user");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!deleteReason || deleteReason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        if (!deleteConfirm) {
            toast.error("Please confirm deletion");
            return;
        }

        try {
            setActionLoading(true);

            await deleteUser(
                userId,
                {
                    delete_type: deletePermanent ? "permanent" : "soft",
                    reason: deleteReason,
                    confirm: deleteConfirm,
                },
                deletePermanent
            );

            toast.success(`User ${deletePermanent ? 'permanently deleted' : 'deleted'} successfully`);
            setShowDeleteDialog(false);
            onClose(); // Close modal after deletion
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(error.response?.data?.detail || "Failed to delete user");
        } finally {
            setActionLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format datetime
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Capitalize first letter
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    if (loading || !user) {
        return (
            <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
                <div className="bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full max-w-2xl p-6 relative">
                    <div className="flex items-center justify-center h-96">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full max-w-2xl p-6 relative my-4 max-h-screen overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-gray-800 z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <h2 className="text-xl font-semibold">User Details</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Complete information about {user.full_name || user.username}
                </p>

                {/* Profile Section */}
                <div className="bg-gray-50 p-4 my-6 rounded-xl border border-[#00000066]/40">
                    <div className="flex items-center justify-between my-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-[#155DFC] to-[#4F39F6] text-white w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-bold">
                                {(user.full_name || user.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold">{user.full_name || user.username}</h3>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                            </div>
                        </div>

                        <span
                            className={`text-xs px-3 py-1 rounded-md font-medium capitalize ${user.status.toLowerCase() === "active"
                                ? "text-[#008236] bg-green-100"
                                : user.status.toLowerCase() === "inactive"
                                    ? "text-gray-600 bg-gray-100"
                                    : user.status.toLowerCase() === "suspended"
                                        ? "text-red-600 bg-red-100"
                                        : "text-yellow-600 bg-yellow-100"
                                }`}
                        >
                            {user.status.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                        <div className="bg-white p-4 rounded-lg border border-gray-300 my-4">
                            <h4 className="font-semibold text-sm mb-3">Edit User Information</h4>

                            <div className="space-y-3 grid grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        placeholder="Enter full name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Enter email address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Role Dropdown */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <Dropdown
                                        options={["User", "Admin", "Moderator"]}
                                        defaultValue={capitalize(editForm.role)}
                                        onChange={(value) => setEditForm({ ...editForm, role: value.toLowerCase() })}
                                        bgColor="bg-gray-100"
                                        bgOptions="bg-white"
                                        className="w-full"
                                    />
                                </div>

                                {/* Subscription Plan Dropdown */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Subscription Plan
                                    </label>
                                    <Dropdown
                                        options={["Free", "Basic", "Premium", "Pro", "Enterprise"]}
                                        defaultValue={capitalize(editForm.subscription_plan)}
                                        onChange={(value) => setEditForm({ ...editForm, subscription_plan: value.toLowerCase() })}
                                        bgColor="bg-gray-100"
                                        bgOptions="bg-white"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Save/Cancel Buttons */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleEditUser}
                                    disabled={actionLoading}
                                    className="flex-1 cursor-pointer bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({
                                            email: user.email,
                                            full_name: user.full_name,
                                            role: user.role,
                                            subscription_plan: user.subscription || "free",
                                        });
                                    }}
                                    className="flex-1 cursor-pointer bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info Row - Only show when not editing */}
                    {!isEditing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm py-4 text-gray-700 my-4 border-t">
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                {user.phone || "+91 12022947006"}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-500" />
                                {user.location || "India"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-500" />
                                Joined {formatDate(user.joined_at)}
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-gray-500" />
                                <span className="capitalize">{user.subscription || "Free"} Plan</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                                <span className="font-medium">Role:</span>
                                <span className="capitalize">{user.role}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-[#ECECF0] my-4 p-1 flex items-center justify-evenly gap-6 text-sm rounded-lg">
                    {["Subscription", "Resumes", "Payments", "Activity"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`font-medium w-full py-2 ${activeTab === tab
                                ? "bg-white rounded-lg px-4"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="max-h-[300px] overflow-y-auto">
                    {activeTab === "Subscription" && (
                        <div className="border border-[#00000033]/40 p-4 rounded-lg text-sm">
                            <h4 className="font-semibold mb-3">Subscription Details</h4>
                            <div className="space-y-1">
                                <p className="flex justify-between items-center">
                                    <span className="font-medium">Current Plan:</span>
                                    <span className="capitalize">{user.subscription || "Free"}</span>
                                </p>
                                <p className="flex justify-between items-center">
                                    <span className="font-medium">Billing Cycle:</span>
                                    Monthly
                                </p>
                                <p className="flex justify-between items-center">
                                    <span className="font-medium">Status:</span>
                                    <span className="capitalize">{user.status.replace('_', ' ')}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "Resumes" && (
                        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <FileText size={16} /> Resumes List
                            </h4>
                            {user.resumes && user.resumes.length > 0 ? (
                                <div className="divide-y divide-gray-300">
                                    {user.resumes.map((resume: any) => (
                                        <div key={resume.id} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-black">{resume.title || "Untitled Resume"}</p>
                                                <p className="text-gray-500 text-xs">
                                                    Last updated: {formatDate(resume.updated_at)}
                                                </p>
                                            </div>
                                            <span className="cursor-pointer font-semibold text-blue-600">View</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No resumes found</p>
                            )}
                        </div>
                    )}

                    {activeTab === "Payments" && (
                        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <CreditCard size={16} /> Payment History
                            </h4>
                            {user.payments && user.payments.length > 0 ? (
                                <div className="divide-y divide-gray-300">
                                    {user.payments.map((payment: any) => (
                                        <div key={payment.id} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-black">₹{payment.amount}</p>
                                                <p className="text-gray-500 text-xs">{formatDate(payment.created_at)}</p>
                                            </div>
                                            <span
                                                className={`py-2 ${payment.status === "completed" ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                {payment.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No payment history</p>
                            )}
                        </div>
                    )}

                    {activeTab === "Activity" && (
                        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Activity size={16} /> Activity Logs
                            </h4>
                            {activities.length > 0 ? (
                                <div className="divide-y divide-gray-300">
                                    {activities.map((item) => (
                                        <div key={item.id} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-black capitalize">
                                                    {item.event_type.replace('_', ' ')}
                                                </p>
                                                <p className="text-gray-500 text-xs">{item.event_details}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs">{formatDateTime(item.created_at)}</p>
                                                <p className="text-xs text-gray-500">IP: {item.ip_address}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No activity logs</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="grid grid-cols-3 gap-4 my-4">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-white bg-[#155DFC] hover:bg-[#1348cc]"
                        >
                            <SquarePen className="w-4 h-4" />
                            <span>Edit User</span>
                        </button>

                        {user.status.toLowerCase() === "suspended" ? (
                            <button
                                onClick={handleUnsuspendUser}
                                disabled={actionLoading}
                                className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-green-700 border border-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                <span>Unsuspend</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowSuspendDialog(true)}
                                className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-[#9E5559] border hover:bg-red-50"
                            >
                                <Ban className="w-4 h-4" />
                                <span>Suspend</span>
                            </button>
                        )}

                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-[#E7000B] bg-[#FF5B5B33] hover:bg-[#FF5B5B55]"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </div>
                )}

                {/* Suspend Dialog */}
                {showSuspendDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Suspend User</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Please provide a reason for suspending this user. The user will be notified.
                            </p>
                            <textarea
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                placeholder="Reason for suspension (minimum 10 characters)"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4"
                                rows={4}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSuspendUser}
                                    disabled={actionLoading || suspendReason.length < 10}
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSuspendDialog(false);
                                        setSuspendReason("");
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Dialog */}
                {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete User</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This action cannot be undone. Please provide a reason and confirm deletion.
                            </p>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Reason for deletion (minimum 10 characters)"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4"
                                rows={3}
                            />
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={deletePermanent}
                                    onChange={(e) => setDeletePermanent(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm">Permanent deletion (cannot be recovered)</label>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-semibold">I confirm this deletion</label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={actionLoading || deleteReason.length < 10 || !deleteConfirm}
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deletePermanent ? "Permanently Delete" : "Delete"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteDialog(false);
                                        setDeleteReason("");
                                        setDeletePermanent(false);
                                        setDeleteConfirm(false);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default UserDetailsModal;