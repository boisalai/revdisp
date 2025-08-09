'use client'

import { useState, useEffect, useCallback } from 'react'
import { MarginalRateCalculator, MarginalRateData } from '../lib/calculators/MarginalRateCalculator'

interface UseStreamgraphDataProps {
  taxYear?: number
  householdType?: 'single' | 'couple' | 'single_parent' | 'retiree'
  incomeStep?: number
  maxIncome?: number
  enabled?: boolean
}

interface UseStreamgraphDataReturn {
  data: MarginalRateData[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export const useStreamgraphData = ({
  taxYear = 2024,
  householdType = 'single',
  incomeStep = 2000,
  maxIncome = 200000,
  enabled = true
}: UseStreamgraphDataProps = {}): UseStreamgraphDataReturn => {
  const [data, setData] = useState<MarginalRateData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateMarginalRates = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const calculator = new MarginalRateCalculator(taxYear, incomeStep, maxIncome)
      const marginalRates = await calculator.calculateMarginalRates(householdType)
      setData(marginalRates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Error calculating marginal rates:', err)
    } finally {
      setLoading(false)
    }
  }, [taxYear, householdType, incomeStep, maxIncome, enabled])

  const refresh = useCallback(() => {
    calculateMarginalRates()
  }, [calculateMarginalRates])

  useEffect(() => {
    calculateMarginalRates()
  }, [calculateMarginalRates])

  return {
    data,
    loading,
    error,
    refresh
  }
}