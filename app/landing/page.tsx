'use client'
import { useRouter } from 'next/navigation'

export default function Landing() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    <span className="font-bold text-xl">MemoryOS</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/login')}
                        className="text-gray-400 hover:text-white transition-colors text-sm">
                        تسجيل الدخول / Sign In
                    </button>
                    <button onClick={() => router.push('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all">
                        ابدأ الآن / Get Started
                    </button>
                </div>
            </nav>

            <section className="max-w-7xl mx-auto px-6 py-24 text-center">
                <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-600/20 rounded-full px-4 py-2 mb-8">
                    <span className="text-purple-400 text-sm">🚀 AI Memory Platform for Companies</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    شركتك تعمل<br />
                    <span className="text-purple-400">بذاكرة لا تنسى</span>
                </h1>
                <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                    MemoryOS يحول كل وثائقك وقراراتك وتاريخ شركتك إلى ذكاء اصطناعي يجيب على أي سؤال في ثوانٍ
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <button onClick={() => router.push('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-4 rounded-xl text-lg transition-all">
                        ابدأ الآن ←
                    </button>
                    <button onClick={() => router.push('/join')}
                        className="border border-gray-700 hover:border-purple-500 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl text-lg transition-all">
                        انضم بكود دعوة
                    </button>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                    {[
                        { number: '10x', label: 'أسرع في الوصول للمعلومات' },
                        { number: '100%', label: 'بيانات معزولة لكل شركة' },
                        { number: '24/7', label: 'ذاكرة الشركة متاحة دايماً' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <p className="text-3xl font-bold text-purple-400 mb-1">{stat.number}</p>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-24">
                <h2 className="text-3xl font-bold text-center mb-4">كل حاجة شركتك محتاجها</h2>
                <p className="text-gray-400 text-center mb-16">مش مجرد chatbot — ده نظام ذاكرة كامل لشركتك</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: '🧠', title: 'ذاكرة ذكية', desc: 'ارفع PDF, Word, Excel, كود — وسأل أي سؤال عن محتواهم بالذكاء الاصطناعي' },
                        { icon: '📅', title: 'تايم لاين تلقائي', desc: 'الـ AI بيستخرج تلقائياً كل الأحداث المهمة من وثائقك ويرتبها زمنياً' },
                        { icon: '👥', title: 'إدارة الفريق', desc: 'أضف موظفين بكود دعوة، حدد صلاحياتهم، وكل شركة بياناتها معزولة تماماً' },
                        { icon: '🎯', title: 'ذكاء تنفيذي', desc: 'تحليل AI يطلع مخاطر وفرص وتوصيات تلقائية — زي مستشار تنفيذي' },
                        { icon: '🔒', title: 'أمان Enterprise', desc: 'كل شركة في بيئة معزولة تماماً. بياناتك مش بتتشارك مع أي شركة تانية' },
                        { icon: '📊', title: 'دعم Excel والكود', desc: 'ارفع spreadsheets وملفات كود — الـ AI يفهم الجداول والأكواد' },
                    ].map((feature, i) => (
                        <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-600 transition-all">
                            <div className="text-3xl mb-4">{feature.icon}</div>
                            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-800">
                <h2 className="text-3xl font-bold text-center mb-16">إزاي بيشتغل؟</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { step: '1', title: 'سجّل شركتك', desc: 'إنشاء حساب في دقيقة بـ Google أو Email' },
                        { step: '2', title: 'ارفع وثائقك', desc: 'PDF, Word, Excel, كود — أي نوع ملف' },
                        { step: '3', title: 'اسأل بالعربي', desc: 'اسأل أي سؤال وهياخد إجابة فورية' },
                        { step: '4', title: 'أضف فريقك', desc: 'ابعت أكواد دعوة للموظفين وحدد صلاحياتهم' },
                    ].map((item, i) => (
                        <div key={i} className="text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                {item.step}
                            </div>
                            <h3 className="font-bold mb-2">{item.title}</h3>
                            <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="bg-purple-900/30 rounded-2xl p-12 text-center border border-purple-800/50">
                    <h2 className="text-3xl font-bold mb-4">جاهز تحول شركتك؟</h2>
                    <p className="text-gray-400 mb-8">ابدأ الآن — مجاني تماماً</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <button onClick={() => router.push('/login')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-10 py-4 rounded-xl text-lg transition-all">
                            ابدأ الآن ←
                        </button>
                        <button onClick={() => router.push('/join')}
                            className="border border-purple-600 hover:bg-purple-600/10 text-purple-400 font-medium px-10 py-4 rounded-xl text-lg transition-all">
                            انضم بكود دعوة
                        </button>
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-800 px-6 py-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🧠</span>
                        <span className="font-bold">MemoryOS</span>
                        <span className="text-gray-500 text-sm">— ذاكرة شركتك الذكية</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2026 MemoryOS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}