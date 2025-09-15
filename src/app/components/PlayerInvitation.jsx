// /components/PlayerInvitation.js
'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Copy, Check } from 'lucide-react'

export default function PlayerInvitation({ player, coach, onInviteSent }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const sendInvite = async () => {
    if (!email) return
    
    setLoading(true)
    try {
      // Generate invite code
      const { data: codeResult } = await supabase.rpc('generate_invite_code')
      const inviteCode = codeResult

      // Create invite record
      const { data: invite, error: inviteError } = await supabase
        .from('player_invites')
        .insert([{
          player_id: player.id,
          coach_id: coach.id,
          email: email,
          invite_code: inviteCode
        }])
        .select()
        .single()

      if (inviteError) throw inviteError

      // Update player with email
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          email: email,
          invite_sent: true 
        })
        .eq('id', player.id)

      if (updateError) throw updateError

      // Generate invite link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/player/join?code=${inviteCode}`
      setInviteLink(link)

      onInviteSent?.(email)
    } catch (error) {
      console.error('Error sending invite:', error)
      alert('Error sending invite: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (inviteLink) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <h4 className="font-medium text-green-800 mb-2">Invite sent to {player.name}!</h4>
        <p className="text-sm text-green-700 mb-3">
          Share this link with {player.name} to access their reports:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
          />
          <button
            onClick={copyInviteLink}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-blue-600" />
        <h4 className="font-medium text-blue-800">Invite {player.name} to view reports</h4>
      </div>
      
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Player's email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={sendInvite}
          disabled={loading || !email}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </div>
    </div>
  )
}