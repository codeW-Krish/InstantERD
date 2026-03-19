import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil, Clock, ChevronDown, User } from 'lucide-react';
import { Button } from './Button';

export interface ProfileData {
    fullName: string;
    email: string;
    timezone: string;
    workingHours: string;
    title: string;
    avatarUrl: string;
    lastUpdated: string;
}

interface EditProfileProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ProfileData;
    onSave: (data: ProfileData) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({
    isOpen,
    onClose,
    initialData,
    onSave
}) => {
    const [formData, setFormData] = useState<ProfileData>(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 backdrop-blur-sm bg-paper/20 dark:bg-paper/60"
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-3xl z-[101] my-auto pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="pointer-events-auto w-full rounded-2xl shadow-2xl border overflow-hidden 
                                     bg-blueprint border-paper/10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-paper/5">
                                <h2 className="text-2xl font-serif font-semibold text-paper">Edit Profile</h2>
                                <button 
                                    title="Close" 
                                    onClick={onClose} 
                                    className="text-paper/40 hover:text-emerald-accent transition-colors p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col md:flex-row bg-blueprint/50">

                                {/* Form Section */}
                                <div className="flex-[1.5] p-6 md:p-8 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Full name</label>
                                            <input 
                                                title="Full Name"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-lg border border-paper/10 outline-none transition-all text-sm font-medium
                                                         bg-blueprint/50 text-paper focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Email Address</label>
                                            <input 
                                                title="Email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-lg border border-paper/10 outline-none transition-all text-sm font-medium
                                                         bg-blueprint/50 text-paper focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Timezone</label>
                                            <div className="relative">
                                                <select 
                                                    title="Timezone"
                                                    name="timezone"
                                                    value={formData.timezone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-paper/10 appearance-none outline-none text-sm font-medium
                                                             bg-blueprint/50 text-paper focus:border-emerald-accent/50"
                                                >
                                                    <option value="GMT-8">Pacific Time (GMT-8)</option>
                                                    <option value="GMT+0">London (GMT+0)</option>
                                                    <option value="GMT+5">Mumbai (GMT+5)</option>
                                                    <option value="GMT+8">Singapore (GMT+8)</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-paper/30" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Working Hours</label>
                                            <div className="relative">
                                                <input 
                                                    title="Working Hours"
                                                    name="workingHours"
                                                    value={formData.workingHours}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-paper/10 outline-none text-sm font-medium
                                                             bg-blueprint/50 text-paper focus:border-emerald-accent/50"
                                                />
                                                <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/30" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Professional Title</label>
                                        <input 
                                            title="Title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-paper/10 outline-none transition-all text-sm font-medium
                                                     bg-blueprint/50 text-paper focus:border-emerald-accent/50"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px bg-paper/5" />

                                {/* Preview Section */}
                                <div className="flex-1 p-8 flex flex-col items-center justify-center bg-paper/[0.02]">
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-paper/20 mb-6">Live Preview</span>
                                    <div className="relative mb-6 group">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-emerald-accent/20 ring-4 ring-blueprint shadow-xl">
                                            {formData.avatarUrl ? (
                                                <img
                                                    src={formData.avatarUrl}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-emerald-accent/5 flex items-center justify-center text-emerald-accent">
                                                    <User size={48} />
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            title="Change Avatar" 
                                            className="absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg border 
                                                     bg-blueprint border-paper/10 text-paper/60 hover:text-emerald-accent transition-all
                                                     hover:scale-110 active:scale-95"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-paper text-center">{formData.fullName || 'New Architect'}</h3>
                                    <p className="text-sm font-mono uppercase tracking-wider text-paper/40 text-center mt-1">{formData.title || 'Data Designer'}</p>
                                    
                                    <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full border border-paper/5 bg-blueprint text-[11px] font-mono uppercase tracking-widest text-paper/40">
                                        <Clock size={12} className="text-emerald-accent" />
                                        <span>{formData.workingHours || '9:00 AM - 5:00 PM'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-paper/5 bg-blueprint">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-paper/20">
                                    Last sync: <span className="text-paper/40">{formData.lastUpdated}</span>
                                </span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="flex-1 sm:flex-none h-10"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => onSave(formData)}
                                        variant="primary"
                                        className="flex-1 sm:flex-none h-10"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
