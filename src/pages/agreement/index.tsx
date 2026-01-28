import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'

export default function AgreementPage() {
  const router = useRouter()
  const [type, setType] = useState<string>('user')

  useEffect(() => {
    const { type: queryType } = router.params
    if (queryType) {
      setType(queryType)
      const title = queryType === 'privacy' ? '隐私政策' : '用户协议'
      Taro.setNavigationBarTitle({ title })
    }
  }, [router.params])

  const renderUserAgreement = () => (
    <View className='content-section'>
      <Text className='title'>用户协议</Text>
      <Text className='paragraph'>欢迎使用叠嘉DIY水晶手串定制小程序。在您使用本服务前，请阅读并同意以下条款：</Text>
      
      <View className='item'>
        <Text className='item-title'>1. 账号说明</Text>
        <Text className='item-content'>我们通过微信授权获取您的基本信息（昵称、头像）及手机号，用于创建唯一用户账号，以便您保存DIY设计作品及管理订单。</Text>
      </View>

      <View className='item'>
        <Text className='item-title'>2. 服务内容</Text>
        <Text className='item-content'>您可以在本程序进行水晶手串的在线DIY设计、保存方案、分享作品及下单购买。</Text>
      </View>

      <View className='item'>
        <Text className='item-title'>3. 用户义务</Text>
        <Text className='item-content'>请确保提供的信息真实有效。您对账号下执行的所有操作负责。</Text>
      </View>

      <View className='item'>
        <Text className='item-title'>4. 订单约定</Text>
        <Text className='item-content'>订单生成后请及时支付，我们将根据您预留的联系方式进行发货对接。</Text>
      </View>
    </View>
  )

  const renderPrivacyPolicy = () => (
    <View className='content-section'>
      <Text className='title'>隐私政策</Text>
      <Text className='paragraph'>我们非常重视您的个人信息保护。关于手机号的使用说明如下：</Text>

      <View className='item'>
        <Text className='item-title'>1. 信息收集</Text>
        <Text className='item-content'>在您授权后，我们会收集您的手机号、微信昵称和头像。</Text>
      </View>

      <View className='item'>
        <Text className='item-title'>2. 手机号用途</Text>
        <View className='sub-item'>
          <Text className='sub-item-title'>• 账号校验：</Text>
          <Text className='item-content'>用于识别用户身份，确保您的设计方案和订单安全。</Text>
        </View>
        <View className='sub-item'>
          <Text className='sub-item-title'>• 物流对接：</Text>
          <Text className='item-content'>在您购买商品后，手机号将用于物流快递联系，确保货物准确送达。</Text>
        </View>
        <View className='sub-item'>
          <Text className='sub-item-title'>• 售后服务：</Text>
          <Text className='item-content'>当您的订单或设计出现异常时，客服将通过该手机号与您取得联系，提供技术支持或售后保障。</Text>
        </View>
      </View>

      <View className='item'>
        <Text className='item-title'>3. 信息保护</Text>
        <Text className='item-content'>我们承诺对您的隐私信息进行严格保密，除法律要求或物流配送必要需求外，不会向任何第三方泄露您的手机号码。</Text>
      </View>
    </View>
  )

  return (
    <ScrollView className='agreement-page' scrollY>
      <View className='container'>
        {type === 'privacy' ? renderPrivacyPolicy() : renderUserAgreement()}
      </View>
    </ScrollView>
  )
}
