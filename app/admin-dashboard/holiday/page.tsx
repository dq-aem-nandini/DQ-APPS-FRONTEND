'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Search, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { holidayService } from '@/lib/api/holidayService';
import type { HolidaysDTO, HolidaysModel } from '@/lib/api/types';
export default function HolidayListPage() {
  const [holidays, setHolidays] = useState<HolidaysDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidaysDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<HolidaysModel>({
    holidayName: '',
    holidayDate: '',
    comments: '',
  });
  // Fetch all holidays
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await holidayService.getAllHolidays();
      if (res.flag && Array.isArray(res.response)) {
        setHolidays(res.response.sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Filter holidays
  const filteredHolidays = holidays.filter(h =>
    h.holidayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.holidayDate.includes(searchTerm)
  );
  // Open dialog
  const openDialog = async (holiday?: HolidaysDTO) => {
    if (holiday) {
      try {
        const res = await holidayService.getHolidayById(holiday.holidayId);
        if (res.flag && res.response) {
          setEditingHoliday(res.response);
          setFormData({
            holidayName: res.response.holidayName,
            holidayDate: res.response.holidayDate,
            comments: res.response.comments || '',
          });
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load holiday');
        return;
      }
    } else {
      setEditingHoliday(null);
      setFormData({ holidayName: '', holidayDate: '', comments: '' });
    }
    setIsDialogOpen(true);
  };
  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.holidayName.trim() || !formData.holidayDate) {
      toast.error('Holiday name and date are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload: HolidaysModel = {
        holidayName: formData.holidayName.trim(),
        holidayDate: formData.holidayDate,
        comments: formData.comments.trim() || '',
      };
      if (editingHoliday) {
        await holidayService.updateHoliday(editingHoliday.holidayId, payload);
        toast.success('Holiday updated successfully');
      } else {
        await holidayService.addHoliday(payload);
        toast.success('Holiday added successfully');
      }
      setIsDialogOpen(false);
      fetchHolidays();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete with confirmation
  const handleDelete = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await holidayService.deleteHoliday(holidayId);
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete holiday');
    }
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Holiday Calendar
                </h1>
                <p className="text-gray-600 mt-2">Manage all company holidays</p>
              </div>
              <Button
                onClick={() => openDialog()}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Holiday
              </Button>
            </div>
          </div>
          {/* Search */}
          <Card className="mb-8 shadow-xl">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </CardContent>
          </Card>
          {/* Holiday List */}
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                All Holidays ({filteredHolidays.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                </div>
              ) : filteredHolidays.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No holidays found</p>
                  <p className="text-sm mt-2">Click "Add Holiday" to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Holiday Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Comments</th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHolidays.map((holiday) => (
                        <tr
                          key={holiday.holidayId}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 text-purple-700 rounded-lg px-3 py-2 font-medium">
                                {format(new Date(holiday.holidayDate), 'dd MMM')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {format(new Date(holiday.holidayDate), 'EEEE')}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6 font-medium text-gray-900">
                            {holiday.holidayName}
                          </td>
                          <td className="py-5 px-6 text-gray-600">
                            {holiday.comments || <span className="text-gray-400 italic">No comments</span>}
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDialog(holiday)}
                                className="hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(holiday.holidayId)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div>
                <Label>Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.holidayDate}
                  onChange={e => setFormData(prev => ({ ...prev, holidayDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Holiday Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.holidayName}
                  onChange={e => setFormData(prev => ({ ...prev, holidayName: e.target.value }))}
                  placeholder="e.g. Diwali"
                  required
                />
              </div>
              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={formData.comments}
                  onChange={e => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Any notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingHoliday ? 'Update' : 'Add'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}