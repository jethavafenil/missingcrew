'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Check, X, Plus, Edit, Trash2, Save } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  createdAt: string
}

interface Subscription {
  id: string
  userId: string
  planId: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  user: {
    name: string
    email: string
  }
  plan: {
    name: string
  }
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    description: '',
    features: [] as string[]
  })
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch subscription plans
      const plansResponse = await fetch('/api/subscriptions/plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans)
      }

      // Fetch subscriptions
      const subscriptionsResponse = await fetch('/api/admin/subscriptions')
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json()
        setSubscriptions(subscriptionsData.subscriptions)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan })
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    try {
      const response = await fetch('/api/admin/subscriptions/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPlan),
      })

      if (response.ok) {
        fetchData()
        setEditingPlan(null)
      }
    } catch (error) {
      console.error('Error saving plan:', error)
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    if (editingPlan) {
      const updatedFeatures = [...editingPlan.features]
      updatedFeatures.splice(index, 1)
      setEditingPlan({
        ...editingPlan,
        features: updatedFeatures
      })
    }
  }

  const handleAddNewPlan = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlan),
      })

      if (response.ok) {
        fetchData()
        setNewPlan({
          name: '',
          price: 0,
          description: '',
          features: []
        })
      }
    } catch (error) {
      console.error('Error adding new plan:', error)
    }
  }

  const handleAddNewPlanFeature = () => {
    if (newFeature.trim()) {
      setNewPlan({
        ...newPlan,
        features: [...newPlan.features, newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const handleRemoveNewPlanFeature = (index: number) => {
    const updatedFeatures = [...newPlan.features]
    updatedFeatures.splice(index, 1)
    setNewPlan({
      ...newPlan,
      features: updatedFeatures
    })
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
    }
  }

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/reactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      {/* Subscription Plans Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add New Plan Form */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Add New Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <Input
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="Plan name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: parseInt(e.target.value) || 0})}
                    placeholder="Price in INR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="Plan description"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Features</label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a new feature"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewPlanFeature}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {newPlan.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPlanFeature(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddNewPlan}
                disabled={!newPlan.name || newPlan.price <= 0}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Plan
              </Button>
            </div>

            {/* Existing Plans */}
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  {editingPlan?.id === plan.id ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Plan Name</label>
                          <Input
                            value={editingPlan.name}
                            onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Price (₹)</label>
                          <Input
                            type="number"
                            value={editingPlan.price}
                            onChange={(e) => setEditingPlan({...editingPlan, price: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <Input
                            value={editingPlan.description}
                            onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Features</label>
                        <div className="flex space-x-2 mb-2">
                          <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add a new feature"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddFeature}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {editingPlan.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {feature}
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={handleSavePlan}>
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingPlan(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{plan.name}</h3>
                          <p className="text-gray-600">₹{plan.price}/month</p>
                          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.user.name}</TableCell>
                    <TableCell>{subscription.user.email}</TableCell>
                    <TableCell>{subscription.plan.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={subscription.status === 'ACTIVE' ? 'success' : 'destructive'}
                        className={subscription.status === 'ACTIVE' ?
                          'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {subscription.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription.id)}
                          >
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateSubscription(subscription.id)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
