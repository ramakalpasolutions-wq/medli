import axios from 'axios'
import { generateRefundNumber } from '@/lib/utils/helpers'

export async function transferFunds({
  amount,
  beneficiaryName,
  beneficiaryAccount,
  beneficiaryIFSC,
  referenceId,
  remarks,
  transferMode = 'IMPS',
}) {
  const payload = {
    merchant_id: process.env.HDFC_MERCHANT_ID,
    reference_id: referenceId,
    amount: amount.toFixed(2),
    transfer_mode: transferMode,
    beneficiary_name: beneficiaryName,
    beneficiary_account: beneficiaryAccount,
    beneficiary_ifsc: beneficiaryIFSC,
    remarks: remarks || 'MEDLI Settlement',
    api_key: process.env.HDFC_PAYOUT_API_KEY,
  }

  try {
    const response = await axios.post(
      process.env.HDFC_PAYOUT_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HDFC_PAYOUT_API_SECRET}`,
        },
        timeout: 30000,
      }
    )

    const { data } = response

    return {
      success: data.status === 'success' || data.response_code === '01',
      transactionId: data.transaction_id || data.txn_id || null,
      utrNumber: data.utr_number || data.utr || null,
      status: data.status || 'unknown',
      rawResponse: data,
    }
  } catch (err) {
    console.error('[HDFC Payout] Transfer failed:', err.message)
    return {
      success: false,
      transactionId: null,
      utrNumber: null,
      status: 'failed',
      error: err.message,
    }
  }
}

export async function verifyBankAccount({
  accountNumber,
  ifscCode,
  accountName,
}) {
  try {
    const payload = {
      merchant_id: process.env.HDFC_MERCHANT_ID,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      account_name: accountName,
      amount: '1.00', // Penny drop ₹1
      api_key: process.env.HDFC_PAYOUT_API_KEY,
    }

    const response = await axios.post(
      `${process.env.HDFC_PAYOUT_API_URL}/penny-drop`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HDFC_PAYOUT_API_SECRET}`,
        },
        timeout: 30000,
      }
    )

    const { data } = response

    return {
      success: data.status === 'success' || data.response_code === '01',
      verified: data.account_verified || false,
      transactionId: data.transaction_id || null,
      message: data.message || '',
      rawResponse: data,
    }
  } catch (err) {
    console.error('[HDFC Payout] Penny drop failed:', err.message)
    return {
      success: false,
      verified: false,
      transactionId: null,
      error: err.message,
    }
  }
}